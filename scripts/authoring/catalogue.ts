// The media catalogue for authors: every file the archive has or will have —
// the generated ones of files/ and the Commons ones picked in review
// (media-work/picks.json and words.json), grouped by the subject they were
// found for, with kind, title and what each really shows. Writes
// drafts/catalogue.md.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const ROOT = join(import.meta.dir, '..', '..');
const work = (name: string) => join(ROOT, 'media-work', name);
const words: Record<string, { title: string; truth: string; slot: string }> = existsSync(work('words.json'))
  ? JSON.parse(readFileSync(work('words.json'), 'utf8'))
  : {};
const picks: { id: string; as: string }[] = existsSync(work('picks.json')) ? JSON.parse(readFileSync(work('picks.json'), 'utf8')) : [];
const slots = parse(readFileSync(join(ROOT, 'scripts', 'media', 'slots.yaml'), 'utf8')) as { id: string; q: string; for?: string }[];
const slotOrder = new Map(slots.map((s, i) => [s.id, i]));

function kindOf(ext: string) {
  if (['jpg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (['mp3', 'ogg', 'wav', 'flac', 'm4a'].includes(ext)) return 'audio';
  return ext === 'pdf' ? 'document' : 'other';
}

const groups = new Map<string, string[]>();
const add = (slot: string, line: string) => groups.set(slot, [...(groups.get(slot) ?? []), line]);
const seen = new Set<string>();
for (const pick of picks) {
  const w = words[pick.id]!;
  seen.add(pick.id);
  add(w.slot, `- \`${pick.id}\` ${kindOf(pick.as)} .${pick.as} — **${w.title}** — ${w.truth}`);
}
for (const name of existsSync(join(ROOT, 'files')) ? readdirSync(join(ROOT, 'files')).sort() : []) {
  const id = name.replace(/\.yaml$/, '');
  if (seen.has(id)) continue;
  const file = parse(readFileSync(join(ROOT, 'files', name), 'utf8'));
  add(file.origin === 'generated' ? '~generated' : '~other', `- \`${id}\` ${file.kind} .${file.ext} — **${file.title}** — ${file.truth}`);
}
const ordered = [...groups.keys()].sort((a, b) => (slotOrder.get(a) ?? 9999) - (slotOrder.get(b) ?? 9999) || a.localeCompare(b));
const out: string[] = [
  '# Media catalogue',
  '',
  'Every file an author may place, by the subject it was found for. Use the id',
  'alone in frontmatter (`banner: whitby-abbey-1`) and in `file="…"` of a',
  'directive. `image` and `video` go in `::media`, galleries, banners and',
  'showcases (icons and status pictures: `image` only); `audio` in `::audio`;',
  "anything in `::file` and `files:`. The title is the file's own; a caption can",
  'say more. The last part of each line is what the file really shows: the story',
  "may treat it as Mira's own photo or recording.",
  '',
];
for (const slot of ordered) {
  const meta = slots.find((s) => s.id === slot);
  out.push(`## ${slot === '~generated' ? "Mira's own data and notes (generated)" : slot}${meta?.for ? ` — for ${meta.for}` : ''}`, '', ...groups.get(slot)!, '');
}
mkdirSync(join(ROOT, 'drafts'), { recursive: true });
writeFileSync(join(ROOT, 'drafts', 'catalogue.md'), out.join('\n'));
console.log(`${[...groups.values()].flat().length} files in ${groups.size} groups`);
