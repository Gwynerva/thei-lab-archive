// Makes the assets of a release (FORMAT.md, "Releases") in dist/:
//
//   text.tar       every file git tracks, but media/
//   media-NN.tar   the files, uncompressed, as media/<id>.<ext>, at most about
//                  300 MB a pack, each with ATTRIBUTION.md
//   release.json   hashes of every asset and every file, what each file is
//
//   bun scripts/release.ts            build dist/ for the version in archive.yaml
//   bun scripts/release.ts --publish  and publish it: tag v<version>, gh release
//
// Tars are written here, byte for byte the same for the same input: sorted
// entries, fixed times and owners. The commit is HEAD, which must be clean
// and pushed before --publish.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, writeSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { parse } from 'yaml';

const ROOT = join(import.meta.dir, '..');
const DIST = join(ROOT, 'dist');
const MEDIA = join(ROOT, 'media');
const PACK_LIMIT = 300_000_000;
const MTIME = Math.floor(Date.UTC(2026, 9, 15) / 1000);

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', flac: 'audio/flac', m4a: 'audio/mp4',
  pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv', json: 'application/json', zip: 'application/zip',
};

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

// ------------------------------------------------------------------- tar
function octal(value: number, length: number) {
  return `${value.toString(8).padStart(length - 1, '0')}\0`;
}

function header(name: string, size: number): Buffer {
  const block = Buffer.alloc(512);
  let path = name;
  let prefix = '';
  if (Buffer.byteLength(path) > 100) {
    const cut = path.lastIndexOf('/', 155);
    prefix = path.slice(0, cut);
    path = path.slice(cut + 1);
    if (Buffer.byteLength(path) > 100 || Buffer.byteLength(prefix) > 155) throw new Error(`${name}: too long for ustar`);
  }
  block.write(path, 0, 100, 'utf8');
  block.write(octal(0o644, 8), 100, 'ascii');
  block.write(octal(0, 8), 108, 'ascii');
  block.write(octal(0, 8), 116, 'ascii');
  block.write(octal(size, 12), 124, 'ascii');
  block.write(octal(MTIME, 12), 136, 'ascii');
  block.write('        ', 148, 'ascii');
  block.write('0', 156, 'ascii');
  block.write('ustar\0', 257, 'ascii');
  block.write('00', 263, 'ascii');
  block.write(prefix, 345, 155, 'utf8');
  let sum = 0;
  for (const byte of block) sum += byte;
  block.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 'ascii');
  return block;
}

/** Writes a tar of [name in the tar, path on disk or bytes] and returns its sha256 and size. */
function writeTar(out: string, entries: [string, string | Buffer][]): { sha256: string; bytes: number } {
  const hash = createHash('sha256');
  const fd = openSync(out, 'w');
  let bytes = 0;
  const put = (chunk: Buffer) => {
    writeSync(fd, chunk);
    hash.update(chunk);
    bytes += chunk.length;
  };
  for (const [name, source] of entries) {
    const data = typeof source === 'string' ? readFileSync(source) : source;
    put(header(name, data.length));
    put(data);
    const rest = (512 - (data.length % 512)) % 512;
    if (rest) put(Buffer.alloc(rest));
  }
  put(Buffer.alloc(1024));
  closeSync(fd);
  return { sha256: hash.digest('hex'), bytes };
}

const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex');

// ------------------------------------------------------------ media facts
function probe(path: string): { width?: number; height?: number; duration?: number } {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', path], { encoding: 'utf8' });
  const json = JSON.parse(out);
  const video = json.streams?.find((s: any) => s.codec_type === 'video');
  const duration = Number(json.format?.duration);
  return { width: video?.width, height: video?.height, duration: Number.isFinite(duration) ? Math.round(duration * 100) / 100 : undefined };
}

async function facts(path: string, ext: string): Promise<{ width: number | null; height: number | null; durationSec: number | null; pages: number | null }> {
  const none = { width: null, height: null, durationSec: null, pages: null };
  if (['jpg', 'png', 'webp', 'avif', 'gif', 'svg'].includes(ext)) {
    const sharp = (await import('sharp')).default;
    const meta = await sharp(path, { animated: true }).metadata().catch(() => undefined);
    if (!meta) return none;
    return { ...none, width: meta.width ?? null, height: meta.pageHeight ?? meta.height ?? null };
  }
  if (['mp4', 'webm', 'mov'].includes(ext)) {
    const p = probe(path);
    return { ...none, width: p.width ?? null, height: p.height ?? null, durationSec: p.duration ?? null };
  }
  if (['mp3', 'ogg', 'wav', 'flac', 'm4a'].includes(ext)) return { ...none, durationSec: probe(path).duration ?? null };
  if (ext === 'pdf') {
    // The page tree's /Count, read from the file and from its compressed object streams.
    const bytes = readFileSync(path);
    const text = bytes.toString('latin1');
    const parts = [text];
    for (const m of text.matchAll(/stream\r?\n/g)) {
      const start = m.index! + m[0].length;
      const end = text.indexOf('endstream', start);
      if (end < 0) continue;
      try {
        parts.push(inflateSync(bytes.subarray(start, end)).toString('latin1'));
      } catch {
        // Not a deflated stream (an image, say).
      }
    }
    const counts = parts.flatMap((part) =>
      [...part.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)|\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages\b/g)].map((m) => Number(m[1] ?? m[2])),
    );
    return { ...none, pages: counts.length ? Math.max(...counts) : null };
  }
  return none;
}

// ------------------------------------------------------------------- main
const publish = process.argv.includes('--publish');
const meta = parse(readFileSync(join(ROOT, 'archive.yaml'), 'utf8'));
const version: string = meta.version;
const commit = git('rev-parse', 'HEAD');
if (git('status', '--porcelain')) throw new Error('The working tree is not clean: commit first.');

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// The texts: what git tracks, as it is in HEAD's working tree.
const tracked = git('ls-files', '-z').split('\0').filter((p) => p && !p.startsWith('media/')).sort();
const text = writeTar(join(DIST, 'text.tar'), tracked.map((p) => [p, join(ROOT, p)]));
console.log(`text.tar: ${tracked.length} files, ${(text.bytes / 1e6).toFixed(1)} MB`);

// The media: every file of files/ has its bytes in media/.
const described = readdirSync(join(ROOT, 'files')).filter((n) => n.endsWith('.yaml')).sort();
const items = described.map((name) => {
  const id = name.replace(/\.yaml$/, '');
  const file = parse(readFileSync(join(ROOT, 'files', name), 'utf8'));
  const path = join(MEDIA, `${id}.${file.ext}`);
  if (!existsSync(path)) throw new Error(`media/${id}.${file.ext} is missing`);
  return { id, ext: file.ext as string, path, size: statSync(path).size, file };
});
const extra = readdirSync(MEDIA).filter((n) => !items.some((i) => `${i.id}.${i.ext}` === n) && !n.startsWith('.'));
if (extra.length) console.warn(`  media/ has ${extra.length} files nobody describes, left out: ${extra.slice(0, 5).join(', ')}`);

// Packs, filled in the order of the ids.
const packs: { asset: string; items: typeof items }[] = [];
for (const item of items) {
  let pack = packs.at(-1);
  const used = pack?.items.reduce((n, i) => n + i.size, 0) ?? Infinity;
  if (!pack || used + item.size > PACK_LIMIT) packs.push((pack = { asset: `media-${String(packs.length + 1).padStart(2, '0')}.tar`, items: [] }));
  pack.items.push(item);
}

function attribution(list: typeof items): Buffer {
  const lines = [
    `# Attribution — Thei lab archive ${version}`,
    '',
    'The files of this pack, each with its author, licence and source. Files from',
    'Wikimedia Commons keep their own licences; files made for the archive are CC0.',
    '',
  ];
  for (const { id, ext, file } of list) {
    if (file.origin === 'commons')
      lines.push(`- \`media/${id}.${ext}\` — ${file.attribution ?? `${file.author}, ${file.licence}`}. Licence: ${file.licence}${file.licenceUrl ? ` (${file.licenceUrl})` : ''}. Source: ${file.source?.page}.${file.transform ? ` Changes: ${file.transform}.` : ''}`);
    else lines.push(`- \`media/${id}.${ext}\` — made for this archive, ${file.licence}.`);
  }
  return Buffer.from(`${lines.join('\n')}\n`, 'utf8');
}

const release = {
  format: Number(meta.format),
  revision: Number(meta.revision ?? 0),
  version,
  commit,
  text: { asset: 'text.tar', sha256: text.sha256, bytes: text.bytes },
  packs: [] as { asset: string; sha256: string; bytes: number; files: number }[],
  files: {} as Record<string, unknown>,
};
for (const pack of packs) {
  const written = writeTar(join(DIST, pack.asset), [
    ['ATTRIBUTION.md', attribution(pack.items)],
    ...pack.items.map((i) => [`media/${i.id}.${i.ext}`, i.path] as [string, string]),
  ]);
  release.packs.push({ asset: pack.asset, sha256: written.sha256, bytes: written.bytes, files: pack.items.length });
  for (const item of pack.items) {
    const data = readFileSync(item.path);
    release.files[item.id] = {
      pack: pack.asset,
      path: `media/${item.id}.${item.ext}`,
      sha256: sha256(data),
      bytes: data.length,
      mime: MIME[item.ext] ?? 'application/octet-stream',
      ...(await facts(item.path, item.ext)),
    };
  }
  console.log(`${pack.asset}: ${pack.items.length} files, ${(written.bytes / 1e6).toFixed(1)} MB`);
}
const releaseJson = Buffer.from(`${JSON.stringify(release, null, 2)}\n`, 'utf8');
writeFileSync(join(DIST, 'release.json'), releaseJson);
const releaseSha = sha256(releaseJson);
console.log(`release.json: ${Object.keys(release.files).length} files, sha256 ${releaseSha}`);
console.log(`commit ${commit}`);

if (publish) {
  const tag = `v${version}`;
  if (git('rev-parse', 'HEAD') !== git('rev-parse', `origin/${git('rev-parse', '--abbrev-ref', 'HEAD')}`))
    throw new Error('HEAD is not pushed: push first.');
  const assets = ['release.json', 'text.tar', ...release.packs.map((p) => p.asset)].map((a) => join(DIST, a));
  const exists = (() => {
    try {
      execFileSync('gh', ['release', 'view', tag], { cwd: ROOT, stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();
  if (!exists)
    execFileSync('gh', ['release', 'create', tag, '--target', commit, '--title', `${meta.title} — ${version}`, '--notes', `Release ${version} of the Thei lab archive (format ${release.format}, revision ${release.revision}).\n\nrelease.json sha256: ${releaseSha}\ncommit: ${commit}`], { cwd: ROOT, stdio: 'inherit' });
  // Upload asset by asset, again on failure: the proxy is not always kind.
  for (const asset of assets) {
    for (let attempt = 1; ; attempt++) {
      try {
        execFileSync('gh', ['release', 'upload', tag, asset, '--clobber'], { cwd: ROOT, stdio: 'inherit' });
        console.log(`uploaded ${asset.split(/[\\/]/).pop()}`);
        break;
      } catch (error) {
        if (attempt >= 8) throw error;
        console.warn(`  upload of ${asset} failed (${attempt}); again in ${attempt * 15} s`);
        await Bun.sleep(attempt * 15_000);
      }
    }
  }
  console.log(`published ${tag}: release.json sha256 ${releaseSha}, commit ${commit}`);
}
