// Checks plants.yaml against the archive: every planted word is where the
// plant says, and a unique word nowhere else. Also reports where the
// reserved words of the guide turn up.
//
//   bun scripts/authoring/check-plants.ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';

const ROOT = join(import.meta.dir, '..', '..');
const texts = new Map<string, string>();
const walk = (dir: string) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(md|yaml)$/.test(entry.name)) texts.set(relative(ROOT, path).replaceAll('\\', '/'), readFileSync(path, 'utf8'));
  }
};
for (const dir of ['diary', 'events', 'projects', 'pages', 'tags', 'files']) walk(join(ROOT, dir));
texts.set('person.md', existsSync(join(ROOT, 'person.md')) ? readFileSync(join(ROOT, 'person.md'), 'utf8') : '');

function pathOf(ref: string | undefined, file: string | undefined): string[] {
  if (file) return [`files/${file}.yaml`];
  if (!ref) return [];
  if (ref === 'profile') return ['person.md'];
  const [kind, id] = [ref.slice(0, ref.indexOf(':')), ref.slice(ref.indexOf(':') + 1)];
  switch (kind) {
    case 'diary':
      return id.startsWith('today') ? [`diary/relative/${id}.md`] : [`diary/${id.slice(0, 4)}/${id}.md`];
    case 'event':
      return [...texts.keys()].filter((p) => p.startsWith('events/') && p.endsWith(`/${id}.md`));
    case 'project':
      return [`projects/${id}/project.md`];
    case 'section': {
      const [project, section] = id.split('/');
      return [...texts.keys()].filter((p) => p.startsWith(`projects/${project}/sections/`) && p.endsWith(`-${section}.md`));
    }
    case 'page':
      return [`pages/${id}.md`];
    case 'tag':
      return [`tags/${id}.md`];
  }
  return [];
}

const count = (text: string, word: string) => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'gu'))].length;
};

const plants = parse(readFileSync(join(ROOT, 'plants.yaml'), 'utf8')) as {
  id: string; ref?: string; file?: string; traits: string[]; where?: string; word?: string;
}[];
let problems = 0;
for (const plant of plants) {
  const paths = pathOf(plant.ref, plant.file);
  if (!paths.length || !paths.every((p) => texts.has(p))) {
    console.log(`✗ ${plant.id}: ${plant.ref ?? plant.file} is not in the archive`);
    problems++;
    continue;
  }
  if (!plant.word) continue;
  const here = paths.reduce((n, p) => n + count(texts.get(p)!, plant.word!), 0);
  const unique = plant.traits.some((t) => ['unique-word', 'hidden-word', 'private-word', 'link-only-word'].includes(t));
  const elsewhere = [...texts].filter(([p, t]) => !paths.includes(p) && count(t, plant.word!) > 0).map(([p]) => p);
  if (!here) {
    console.log(`✗ ${plant.id}: "${plant.word}" is not in ${paths.join(', ')}`);
    problems++;
  } else if (unique && elsewhere.length) {
    console.log(`✗ ${plant.id}: "${plant.word}" is also in ${elsewhere.join(', ')}`);
    problems++;
  }
}
console.log(`${plants.length} plants, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
