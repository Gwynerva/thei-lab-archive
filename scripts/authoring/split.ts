// Splits writers' bundles into the archive's files and lints what it wrote.
//
//   bun scripts/authoring/split.ts <bundle.md>… [--dry]
//
// A bundle is many files in one: a line `=====> <path>` starts a file (a
// path of the archive, such as diary/2017/2017-01-03.md), and everything up
// to the next such line is its content. The lint reads each text with Thei's
// own scanner (tests/lab/archive/dialect.ts in E:/code/thei) and checks refs
// against BIBLE.md, the diary plan and what is already on disk, and files
// against files/.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { scanText } from 'E:/code/thei/tests/lab/archive/dialect.ts';

const ROOT = join(import.meta.dir, '..', '..');

// ------------------------------------------------------------- what exists
export function knownRefs(): Set<string> {
  const refs = new Set<string>();
  const bible = readFileSync(join(ROOT, 'BIBLE.md'), 'utf8');
  const projects = bible.slice(bible.indexOf('## 7. Projects'), bible.indexOf('### Project statuses'));
  let project = '';
  for (const line of projects.split('\n')) {
    const p = /^\*\*`([a-z0-9-]+)`\*\*/.exec(line);
    if (p) refs.add(`project:${(project = p[1]!)}`);
    const s = /^- `\d{2,3}-([a-z0-9-]+)`/.exec(line);
    if (s) refs.add(`section:${project}/${s[1]}`);
  }
  const table = (from: string, to: string, kind: string) => {
    const part = bible.slice(bible.indexOf(from), bible.indexOf(to));
    for (const m of part.matchAll(/^\| `([a-z0-9-]+)` \|/gm)) refs.add(`${kind}:${m[1]}`);
  };
  table('## 8. Events', '## 9. Pages', 'event');
  table('## 9. Pages', '## 10. Tags', 'page');
  table('## 10. Tags', '## 11.', 'tag');
  const plan = join(ROOT, 'drafts', 'plan');
  if (existsSync(plan))
    for (const name of readdirSync(plan))
      for (const m of readFileSync(join(plan, name), 'utf8').matchAll(/^- (\d{4}-\d{2}-\d{2})/gm)) refs.add(`diary:${m[1]}`);
  refs.add('diary:today+1');
  refs.add('diary:today+2');
  // Whatever is on disk already.
  const walk = (dir: string, visit: (path: string) => void) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir, { withFileTypes: true }))
      name.isDirectory() ? walk(join(dir, name.name), visit) : visit(join(dir, name.name));
  };
  walk(join(ROOT, 'events'), (p) => refs.add(`event:${p.split(/[\\/]/).pop()!.replace(/\.md$/, '')}`));
  walk(join(ROOT, 'diary'), (p) => refs.add(`diary:${p.split(/[\\/]/).pop()!.replace(/\.md$/, '')}`));
  walk(join(ROOT, 'pages'), (p) => refs.add(`page:${p.split(/[\\/]/).pop()!.replace(/\.md$/, '')}`));
  return refs;
}

export function knownFiles(): Map<string, string> {
  const files = new Map<string, string>();
  const dir = join(ROOT, 'files');
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.yaml')) continue;
    const data = parseYaml(readFileSync(join(dir, name), 'utf8'));
    files.set(name.replace(/\.yaml$/, ''), data?.kind ?? 'other');
  }
  return files;
}

// ------------------------------------------------------------------ lint
const PATHS: [RegExp, string][] = [
  [/^diary\/(\d{4})\/(\d{4}-\d{2}-\d{2})\.md$/, 'diary'],
  [/^diary\/relative\/today\+\d+\.md$/, 'diary'],
  [/^events\/\d{4}\/[a-z0-9-]+\.md$/, 'event'],
  [/^projects\/[a-z0-9-]+\/project\.md$/, 'project'],
  [/^projects\/[a-z0-9-]+\/sections\/\d{2,3}-[a-z0-9-]+\.md$/, 'section'],
  [/^pages\/[a-z0-9-]+\.md$/, 'page'],
  [/^tags\/[a-z0-9-]+\.md$/, 'tag'],
  [/^person\.md$/, 'person'],
];

const KEYS: Record<string, string[]> = {
  diary: ['access', 'reminder', 'notes', 'relations'],
  event: ['title', 'summary', 'slug', 'access', 'periods', 'banner', 'tags', 'synonyms', 'reminder', 'notes', 'links', 'files', 'action', 'relations'],
  project: ['title', 'summary', 'slug', 'access', 'featured', 'cv', 'icon', 'banner', 'tags', 'synonyms', 'reminder', 'notes', 'links', 'files', 'showcase', 'statuses', 'action', 'relations'],
  section: ['title', 'summary', 'slug', 'private', 'periods', 'banner'],
  page: ['title', 'summary', 'slug', 'access', 'icon', 'synonyms', 'reminder', 'notes'],
  tag: ['title', 'slug', 'synonyms', 'icon'],
  person: ['name', 'nickname', 'birthDate', 'slogan', 'avatars', 'banner', 'favicon', 'facts', 'links', 'pinned', 'statuses'],
};

function split(text: string): { fields: Record<string, any>; body: string; error?: string } {
  if (!text.startsWith('---\n')) return { fields: {}, body: text.trim() };
  const end = text.indexOf('\n---', 4);
  if (end < 0) return { fields: {}, body: '', error: 'frontmatter not closed' };
  try {
    return { fields: parseYaml(text.slice(4, end + 1)) ?? {}, body: text.slice(text.indexOf('\n', end + 4) + 1).trim() };
  } catch (error) {
    return { fields: {}, body: '', error: `YAML: ${(error as Error).message.split('\n')[0]}` };
  }
}

export function lint(path: string, text: string, refs: Set<string>, files: Map<string, string>): string[] {
  const problems: string[] = [];
  const kind = PATHS.find(([re]) => re.test(path))?.[1];
  if (!kind) return [`not a path of the archive`];
  const { fields, body, error } = split(text);
  if (error) return [error];
  for (const key of Object.keys(fields)) if (!KEYS[kind]!.includes(key) && !key.startsWith('x-')) problems.push(`unknown key ${key}`);
  const needs: Record<string, string[]> = { event: ['title', 'summary', 'periods'], project: ['title', 'summary'], section: ['title'], page: ['title', 'summary'], tag: ['title'], person: ['name'] };
  for (const key of needs[kind] ?? []) if (fields[key] === undefined || fields[key] === '') problems.push(`${key} is required`);
  if (['diary', 'event', 'page'].includes(kind) && !body) problems.push('a body is required');
  if (kind === 'section' && !body && !fields.periods) problems.push('a section needs a body, periods, or both');
  const file = (id: unknown, place: 'picture' | 'visual' | 'audio' | 'any', where: string) => {
    if (typeof id !== 'string' || !id) return;
    const k = files.get(id);
    if (!k) problems.push(`${where}: file "${id}" is not in files/`);
    else if (place === 'picture' && k !== 'image') problems.push(`${where}: "${id}" is ${k}, a picture is needed`);
    else if (place === 'visual' && k !== 'image' && k !== 'video') problems.push(`${where}: "${id}" is ${k}, a picture or video is needed`);
    else if (place === 'audio' && k !== 'audio') problems.push(`${where}: "${id}" is ${k}, a recording is needed`);
  };
  file(fields.icon, 'picture', 'icon');
  file(fields.banner, 'visual', 'banner');
  file(fields.favicon, 'picture', 'favicon');
  for (const a of fields.avatars ?? []) file(a, 'picture', 'avatar');
  for (const f of fields.files ?? []) file(typeof f === 'string' ? f : f?.file, 'any', 'files');
  for (const f of fields.showcase ?? []) file(typeof f === 'string' ? f : f?.file, 'visual', 'showcase');
  for (const s of fields.statuses ?? []) {
    file(s?.file, 'picture', 'status');
    if (!/^(\d{4}-\d{2}-\d{2}|today([+-]\d+)?)$/.test(String(s?.date ?? ''))) problems.push(`status date "${s?.date}"`);
  }
  if (fields.action?.file) file(fields.action.file, 'any', 'action');
  for (const tag of fields.tags ?? []) if (!refs.has(`tag:${tag}`)) problems.push(`tag "${tag}" is not in the bible`);
  for (const p of fields.periods ?? []) {
    const parts = typeof p === 'string' ? p.split('..') : [p?.start, p?.end ?? p?.start];
    for (const d of parts) if (!/^(\d{4}-\d{2}-\d{2}|today([+-]\d+)?)$/.test(String(d ?? ''))) problems.push(`period day "${d}" (write YYYY-MM-DD)`);
    if (typeof p === 'object' && p?.doubt && (!p.precision || p.precision === 'exact')) problems.push('a doubt needs a precision other than exact');
    if (typeof p === 'object' && p?.label && String(p.label).length > 100) problems.push('a period label over 100 characters');
  }
  if (kind === 'event') {
    const first = fields.periods?.[0];
    const start = typeof first === 'string' ? first.split('..')[0] : first?.start;
    if (start && String(start).slice(0, 4) !== path.split('/')[1]) problems.push(`its first period starts in ${String(start).slice(0, 4)}, the folder says ${path.split('/')[1]}`);
  }
  const self = kind === 'diary' ? `diary:${path.split('/').pop()!.replace(/\.md$/, '')}` : kind === 'event' ? `event:${path.split('/').pop()!.replace(/\.md$/, '')}` : kind === 'project' ? `project:${path.split('/')[1]}` : '';
  for (const r of fields.relations ?? []) {
    const to = String(r?.to ?? '');
    if (!refs.has(to)) problems.push(`relation to "${to}", not in the bible or the plan`);
    if (!/^(project|event|diary):/.test(to)) problems.push(`relation to "${to}": only projects, events and diary entries`);
    if (to === self) problems.push('related to itself');
    if (r?.kind && !['related', 'depends-on', 'affects'].includes(r.kind)) problems.push(`relation kind "${r.kind}"`);
    if (r?.note !== undefined && r?.notes !== undefined) problems.push('a relation has a note or notes, not both');
    // Who declares a pair: a diary entry anything; an event projects and earlier events; a project projects.
    if (kind === 'event' && to.startsWith('diary:')) problems.push(`an event never declares a relation to a diary entry (${to}); the entry does`);
    if (kind === 'project' && !to.startsWith('project:')) problems.push(`a project declares relations to projects only (${to}); the event or entry does`);
    if (kind === 'project' && to.startsWith('project:') && to >= self) problems.push(`of two projects, the one whose id sorts first declares the relation (${to})`);
  }
  const texts: [string, string][] = [['body', body]];
  if (typeof fields.notes === 'string') texts.push(['notes', fields.notes]);
  if (kind === 'tag') texts.length = 0;
  for (const [slot, markdown] of texts) {
    if (!markdown.trim()) continue;
    const scan = scanText(markdown);
    for (const p of scan.problems) problems.push(`${slot} ${p}`);
    for (const r of scan.refs) if (!refs.has(r.ref)) problems.push(`${slot} line ${r.line}: "${r.ref}" is not in the bible or the plan`);
    for (const f of scan.files) file(f.id, f.as === 'media' || f.as === 'gallery' ? 'visual' : f.as === 'audio' ? 'audio' : 'any', `${slot} line ${f.line}`);
  }
  return problems;
}

// ------------------------------------------------------------------- main
if (import.meta.main) {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const bundles = args.filter((a) => !a.startsWith('--'));
  const refs = knownRefs();
  const files = knownFiles();
  let count = 0;
  let bad = 0;
  for (const bundle of bundles) {
    const text = readFileSync(bundle, 'utf8').replace(/\r\n?/g, '\n');
    const parts = text.split(/^=====> /m).slice(1);
    for (const part of parts) {
      const newline = part.indexOf('\n');
      const path = part.slice(0, newline).trim();
      const content = `${part.slice(newline + 1).replace(/\s+$/, '')}\n`;
      const problems = lint(path, content, refs, files);
      count++;
      if (problems.length) {
        bad++;
        console.log(`✗ ${path}\n${problems.map((p) => `    ${p}`).join('\n')}`);
      }
      if (!dry && PATHS.some(([re]) => re.test(path))) {
        mkdirSync(dirname(join(ROOT, path)), { recursive: true });
        writeFileSync(join(ROOT, path), content);
      }
    }
  }
  console.log(`${count} files ${dry ? 'checked' : 'written'}, ${bad} with problems`);
  process.exit(bad ? 1 : 0);
}
