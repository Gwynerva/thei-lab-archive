// The media catalogue for authors: every file of files/, grouped by the
// subject it was found for, with its kind, title and what it really shows.
// Writes drafts/catalogue.md.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const ROOT = join(import.meta.dir, '..', '..');
const words: Record<string, { slot: string; for: string }> = existsSync(join(ROOT, 'media-work', 'words.json'))
  ? JSON.parse(readFileSync(join(ROOT, 'media-work', 'words.json'), 'utf8'))
  : {};
const slots = parse(readFileSync(join(ROOT, 'scripts', 'media', 'slots.yaml'), 'utf8')) as { id: string; q: string; for?: string }[];
const slotOrder = new Map(slots.map((s, i) => [s.id, i]));

const groups = new Map<string, string[]>();
for (const name of readdirSync(join(ROOT, 'files')).sort()) {
  const id = name.replace(/\.yaml$/, '');
  const file = parse(readFileSync(join(ROOT, 'files', name), 'utf8'));
  const slot = words[id]?.slot ?? (file.origin === 'generated' ? '~generated' : '~other');
  const line = `- \`${id}\` ${file.kind} .${file.ext} — **${file.title}** — ${file.truth}`;
  groups.set(slot, [...(groups.get(slot) ?? []), line]);
}
const ordered = [...groups.keys()].sort((a, b) => (slotOrder.get(a) ?? 9999) - (slotOrder.get(b) ?? 9999) || a.localeCompare(b));
const out: string[] = [
  '# Media catalogue',
  '',
  'Every file an author may place, by the subject it was found for. Use the id',
  'alone in frontmatter (`banner: whitby-abbey-1`) and in `file="…"` of a',
  'directive. `image` and `video` go in `::media`, galleries, banners and',
  'showcases; `audio` in `::audio`; anything in `::file` and `files:`. The',
  'title is the file\'s own; a caption can say more. "Truth" is what the file',
  'really shows: the story may treat it as Mira\'s own photo or recording.',
  '',
];
for (const slot of ordered) {
  const meta = slots.find((s) => s.id === slot);
  out.push(`## ${slot === '~generated' ? "Mira's own data and notes (generated)" : slot}${meta?.for ? ` — for ${meta.for}` : ''}`, '', ...groups.get(slot)!, '');
}
mkdirSync(join(ROOT, 'drafts'), { recursive: true });
writeFileSync(join(ROOT, 'drafts', 'catalogue.md'), out.join('\n'));
console.log(`${[...groups.values()].flat().length} files in ${groups.size} groups`);
