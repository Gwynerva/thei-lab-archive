// Step 5: files/<id>.yaml for every built file from Commons: what it is in
// the archive (title, description), where it came from, its author and
// licence, what was done to it, and what it really shows.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { WORK } from './commons';
import { readPicks, type Built } from './build';
import { readWords } from './pick';

export const FILES = join(import.meta.dir, '..', '..', 'files');

/** Words of a file set on purpose after review (plants.yaml names why). */
const OVERRIDES: Record<string, { title?: string; description?: string }> = {
  'doc-bookbinding-2': {
    description: 'A history of gold-tooled bindings, more about looking than doing. The pages have foxing all through, which only makes it better.',
  },
};

export function kindOf(ext: string): string {
  if (['jpg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (['mp3', 'ogg', 'wav', 'flac', 'm4a'].includes(ext)) return 'audio';
  return ext === 'pdf' ? 'document' : 'other';
}

/** One YAML document, keys in the order FORMAT.md lists them. */
export function fileYaml(fields: Record<string, unknown>): string {
  const order = ['kind', 'ext', 'title', 'description', 'origin', 'source', 'author', 'licence', 'licenceUrl', 'attribution', 'transform', 'people', 'truth'];
  const sorted: Record<string, unknown> = {};
  for (const key of order) if (fields[key] !== undefined && fields[key] !== '') sorted[key] = fields[key];
  return stringify(sorted, { lineWidth: 0 });
}

if (import.meta.main) {
  const words = readWords();
  mkdirSync(FILES, { recursive: true });
  let written = 0;
  const missing: string[] = [];
  for (const pick of readPicks()) {
    const builtPath = join(WORK, 'built', `${pick.id}.json`);
    if (!existsSync(builtPath)) {
      missing.push(pick.id);
      continue;
    }
    const built: Built = JSON.parse(readFileSync(builtPath, 'utf8'));
    const w = { ...words[pick.id]!, ...OVERRIDES[pick.id] };
    const c = pick.candidate;
    const name = c.title.replace(/^File:/, '');
    const author = c.author || 'unknown';
    const licenceWords = c.licence.id === 'PD' ? 'public domain' : c.licence.id === 'CC0-1.0' ? 'CC0' : c.licence.short;
    writeFileSync(
      join(FILES, `${pick.id}.yaml`),
      fileYaml({
        kind: kindOf(built.ext),
        ext: built.ext,
        title: w.title,
        description: w.description,
        origin: 'commons',
        source: { page: c.page, download: built.download, retrieved: built.retrieved },
        author,
        licence: c.licence.id,
        licenceUrl: c.licence.url,
        attribution: `“${name}” by ${author}, ${licenceWords}, via Wikimedia Commons`,
        transform: built.transform,
        people: w.people,
        truth: w.truth,
      }),
    );
    written++;
  }
  console.log(`${written} files described${missing.length ? `; not built yet: ${missing.length} (${missing.slice(0, 8).join(', ')}…)` : ''}`);
}
