// Talking to Wikimedia Commons politely: one request at a time, at least
// 0.75 s apart, a User-Agent naming this repository, retries with backoff
// for a flaky proxy or a busy server, and API answers cached on disk so a
// rerun asks again only what it has not asked yet.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const USER_AGENT =
  'thei-lab-archive/1.0 (https://github.com/Gwynerva/thei-lab-archive; fictional life archive for Thei tests)';
export const API = 'https://commons.wikimedia.org/w/api.php';
export const WORK = join(import.meta.dir, '..', '..', 'media-work');

const GAP_MS = 750;
let last = 0;

async function politely() {
  const wait = last + GAP_MS - Date.now();
  if (wait > 0) await Bun.sleep(wait);
  last = Date.now();
}

async function withRetries<T>(what: string, attempt: () => Promise<T>, tries = 8): Promise<T> {
  let delay = 2000;
  for (let n = 1; ; n++) {
    try {
      return await attempt();
    } catch (error) {
      if (n >= tries) throw error;
      const message = (error as Error).message;
      const retryAfter = /retry-after (\d+)/.exec(message)?.[1];
      const pause = retryAfter ? Math.max(Number(retryAfter) * 1000, delay) : delay;
      console.warn(`  ${what}: ${message}; again in ${Math.round(pause / 1000)} s (${n}/${tries})`);
      await Bun.sleep(pause);
      delay = Math.min(delay * 2, 120_000);
    }
  }
}

/** An API query, answered from the cache when it was asked before. */
export async function api(params: Record<string, string>): Promise<any> {
  const query = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const key = createHash('sha256').update(query.toString()).digest('hex').slice(0, 24);
  const cached = join(WORK, 'cache', `${key}.json`);
  if (existsSync(cached)) return JSON.parse(readFileSync(cached, 'utf8'));
  const answer = await withRetries('api', async () => {
    await politely();
    const response = await fetch(`${API}?${query}`, {
      headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok)
      throw new Error(`HTTP ${response.status}${response.headers.get('retry-after') ? ` retry-after ${response.headers.get('retry-after')}` : ''}`);
    const json = await response.json();
    if (json.error) throw new Error(`API error ${json.error.code}: ${json.error.info}`);
    return json;
  });
  mkdirSync(dirname(cached), { recursive: true });
  writeFileSync(cached, JSON.stringify(answer));
  return answer;
}

/**
 * Downloads a URL to a path, unless a complete copy is there already (its
 * size recorded beside it). Writes to a temporary file first, so a broken
 * download never looks finished.
 */
export async function download(url: string, path: string, options: { minBytes?: number } = {}): Promise<number> {
  const done = `${path}.done`;
  if (existsSync(path) && existsSync(done) && statSync(path).size === Number(readFileSync(done, 'utf8')))
    return statSync(path).size;
  mkdirSync(dirname(path), { recursive: true });
  return withRetries(`download ${url.split('/').pop()?.slice(0, 60)}`, async () => {
    await politely();
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(600_000),
    });
    if (!response.ok)
      throw new Error(`HTTP ${response.status}${response.headers.get('retry-after') ? ` retry-after ${response.headers.get('retry-after')}` : ''}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const expected = Number(response.headers.get('content-length') ?? 0);
    if (expected && bytes.length !== expected) throw new Error(`got ${bytes.length} of ${expected} bytes`);
    if (bytes.length < (options.minBytes ?? 1)) throw new Error(`only ${bytes.length} bytes`);
    const temporary = `${path}.part`;
    writeFileSync(temporary, bytes);
    renameSync(temporary, path);
    writeFileSync(done, String(bytes.length));
    return bytes.length;
  });
}

/** Plain words from a bit of Commons HTML. */
export function plain(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** A Commons licence as an SPDX-like id, or undefined when it is not one we take. */
export function licenceOf(meta: Record<string, { value: string } | undefined>): { id: string; url: string; short: string } | undefined {
  const code = (meta.License?.value ?? '').toLowerCase().trim();
  const short = plain(meta.LicenseShortName?.value);
  const url = plain(meta.LicenseUrl?.value);
  if (code === 'cc0' || /^cc0/i.test(short))
    return { id: 'CC0-1.0', url: url || 'https://creativecommons.org/publicdomain/zero/1.0/', short: 'CC0' };
  if (code === 'pd' || code.startsWith('pd-') || /^public domain/i.test(short))
    return { id: 'PD', url: url || 'https://commons.wikimedia.org/wiki/Commons:Copyright_tags/Public_domain', short: 'Public domain' };
  const match = /^cc-(by|by-sa)-(\d\.\d)(?:-([a-z]{2,}))?$/.exec(code);
  if (!match) return undefined;
  const [, kind, version, port] = match;
  const id = `CC-${kind!.toUpperCase()}-${version}${port ? `-${port.toUpperCase()}` : ''}`;
  const fallback = `https://creativecommons.org/licenses/${kind}/${version}/${port ? `${port}/` : ''}`;
  return { id, url: url || fallback, short: short || id };
}
