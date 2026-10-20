// Lints archive files on disk, as split.ts lints a bundle's files.
//
//   bun scripts/authoring/lint-files.ts <path>…     (no paths: every text of the archive)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { knownFiles, knownRefs, lint } from './split';

const ROOT = join(import.meta.dir, '..', '..');
const args = process.argv.slice(2);
const paths: string[] = [];
const walk = (dir: string) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith('.md')) paths.push(path);
  }
};
if (args.length) paths.push(...args.map((a) => join(ROOT, relative(ROOT, a.startsWith('/') || /^[A-Z]:/i.test(a) ? a : join(ROOT, a)))));
else {
  for (const dir of ['diary', 'events', 'projects', 'pages', 'tags']) walk(join(ROOT, dir));
  paths.push(join(ROOT, 'person.md'));
}
const refs = knownRefs();
const files = knownFiles();
let bad = 0;
for (const path of paths) {
  if (!statSync(path, { throwIfNoEntry: false })) continue;
  const rel = relative(ROOT, path).replaceAll('\\', '/');
  const problems = lint(rel, readFileSync(path, 'utf8'), refs, files);
  if (problems.length) {
    bad++;
    console.log(`✗ ${rel}\n${problems.map((p) => `    ${p}`).join('\n')}`);
  }
}
console.log(`${paths.length} files checked, ${bad} with problems`);
process.exit(bad ? 1 : 0);
