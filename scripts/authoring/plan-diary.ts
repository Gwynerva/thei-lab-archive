// Which days of the life carry a diary entry, and what each of them touches:
// the events of that day and the stages running through it, read from
// BIBLE.md. Writes drafts/plan/diary-<YYYY>.md, one line a day, for the
// writers of the diary. Deterministic: the same bible gives the same days.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..', '..');
const bible = readFileSync(join(ROOT, 'BIBLE.md'), 'utf8');

const TARGET: Record<number, number> = {
  2016: 70, 2017: 260, 2018: 200, 2019: 190, 2020: 300, 2021: 220, 2022: 210, 2023: 110, 2024: 170, 2025: 160, 2026: 110,
};
// How likely a quiet day of each month is to get an entry, relative to others.
const MONTH_WEIGHT: Record<number, number[]> = {
  2020: [1, 1, 2, 3, 3, 2, 1.5, 1.5, 1.2, 1, 1.2, 0.8],
  2023: [1, 1, 1, 1, 1.4, 1.2, 1, 1, 0.8, 0.5, 0.4, 0.5],
  2024: [0.6, 0.8, 1, 1, 1.2, 1.3, 1.2, 1, 1, 1, 1, 1],
};
const SILENT = new Set(['2020-11-22', '2020-11-23', '2020-11-24', '2020-11-25', '2020-11-26']);

function addDays(day: string, n: number) {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function range(start: string, end: string) {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** "2021-04..2021-06-08" style periods to [start, end] days. */
function period(text: string): [string, string] | undefined {
  const clean = text.split(',')[0]!.trim();
  const [a, b] = clean.split('..').map((s) => s.trim());
  const start = (s: string, end: boolean) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}$/.test(s)) return end ? addDays(`${addDays(`${s}-28`, 4).slice(0, 7)}-01`, -1) : `${s}-01`;
    if (/^\d{4}$/.test(s)) return end ? `${s}-12-31` : `${s}-01-01`;
    if (/^today/.test(s)) return '2026-10-15';
    return undefined;
  };
  const s = a && start(a, false);
  const e = start(b ?? a!, true);
  return s && e ? [s, e] : undefined;
}

// Events.
const events: { id: string; title: string; days: string[]; access: string }[] = [];
for (const m of bible.matchAll(/^\| `([a-z0-9-]+)` \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/gm)) {
  const [, id, when, title, tags] = m as unknown as string[];
  if (!/\d{4}/.test(when!)) continue;
  const days: string[] = [];
  for (const part of when!.split(';')) {
    const p = period(part);
    if (!p) continue;
    const all = range(p[0], p[1]);
    days.push(...(all.length <= 16 ? all : [all[0]!, all.at(-1)!]));
  }
  const access = /private ·/.test(tags!) ? 'private' : /link-only ·/.test(tags!) ? 'link-only' : 'public';
  events.push({ id: id!, title: title!.trim(), days, access });
}

// Stages of projects.
const stages: { ref: string; title: string; start: string; end: string }[] = [];
let project = '';
for (const line of bible.split('\n')) {
  const p = /^\*\*`([a-z0-9-]+)`\*\* — \*([^*]+)\*/.exec(line);
  if (p) project = p[1]!;
  const s = /^- `\d{2}-([a-z0-9-]+)` \*([^*]+)\* — stage (.+)$/.exec(line);
  if (s && project) {
    for (const part of s[3]!.split(';')) {
      const span = period(part.replace(/,.*/, ''));
      if (span) stages.push({ ref: `section:${project}/${s[1]}`, title: s[2]!, start: span[0], end: span[1] });
    }
  }
}

let seed = 1992_03_14;
const random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

mkdirSync(join(ROOT, 'drafts', 'plan'), { recursive: true });
let total = 0;
for (const [yearText, target] of Object.entries(TARGET)) {
  const year = Number(yearText);
  const first = year === 2016 ? '2016-10-01' : `${year}-01-01`;
  const last = year === 2026 ? '2026-10-15' : `${year}-12-31`;
  const all = range(first, last).filter((d) => !SILENT.has(d));
  const chosen = new Set<string>();
  const must = [first, last, `${year}-03-14`, `${year}-12-24`, `${year}-12-25`, '2026-10-01', '2017-11-30', '2018-05-30', '2021-08-30', '2024-06-25', '2026-04-27', '2019-08-31', '2023-08-26'];
  for (const d of must) if (all.includes(d)) chosen.add(d);
  for (const e of events) for (const d of e.days) if (all.includes(d)) chosen.add(d);
  const weights = MONTH_WEIGHT[year] ?? Array(12).fill(1);
  const rest = all.filter((d) => !chosen.has(d));
  const scored = rest.map((d) => ({ d, score: random() * weights[Number(d.slice(5, 7)) - 1]! }));
  scored.sort((a, b) => b.score - a.score);
  for (const { d } of scored) {
    if (chosen.size >= target) break;
    chosen.add(d);
  }
  const days = [...chosen].sort();
  total += days.length;
  const lines = days.map((d) => {
    const today = events.filter((e) => e.days.includes(d)).map((e) => `event:${e.id}${e.access !== 'public' ? ` (${e.access})` : ''} “${e.title}”`);
    const long = (s: { start: string; end: string; ref: string }) => /^section:(this-archive|money|leith-flat|sandviken-flat|biscuit)\//.test(s.ref) || Date.parse(s.end) - Date.parse(s.start) > 400 * 864e5;
    const running = stages.filter((s) => s.start <= d && d <= s.end && s.end !== s.start && !long(s)).map((s) => s.ref);
    const on = stages.filter((s) => s.start === d).map((s) => s.ref);
    return `- ${d}${today.length ? ` · ${today.join('; ')}` : ''}${on.length ? ` · stage day: ${on.join(', ')}` : ''}${running.length ? ` · running: ${running.slice(0, 6).join(', ')}` : ''}`;
  });
  writeFileSync(join(ROOT, 'drafts', 'plan', `diary-${year}.md`), `# Diary days of ${year}: ${days.length}\n\n${lines.join('\n')}\n`);
  console.log(`${year}: ${days.length} days (${events.filter((e) => e.days.some((d) => d.startsWith(String(year)))).length} events)`);
}
console.log(`total ${total}`);
