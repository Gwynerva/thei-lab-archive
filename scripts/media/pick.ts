// Step 3: the reviewers' choices (media-work/review/<group>.yaml) turned into
// the files of the archive: ids, formats, and the words each file gets.
// Writes media-work/picks.json and media-work/words.json.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { WORK } from './commons';
import type { Pick } from './build';
import { readCandidates } from './review';
import { slotFileIds } from './search';

export interface Words {
  title: string;
  description?: string;
  truth: string;
  people: 'none' | 'incidental';
}

interface Choice extends Partial<Words> {
  k: number;
}

/** Videos that also give a short looping GIF, `<id>-loop`. */
const LOOPS = [
  'video-waves-1', 'video-waterfall-1', 'video-rain-1', 'video-cat-1',
  'video-fire-1', 'video-snow-1', 'video-pottery-1', 'video-aurora-1',
];

/** Picks left out after review (a licence still under review on Commons, and the like). */
const DROPPED = new Set(['sound-footsteps-snow']);

export function readWords(): Record<string, Words & { slot: string; for: string }> {
  return JSON.parse(readFileSync(join(WORK, 'words.json'), 'utf8'));
}

if (import.meta.main) {
  const all = readCandidates();
  const reviews: Record<string, Choice[]> = {};
  const dir = join(WORK, 'review');
  for (const name of existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.yaml')).sort() : []) {
    const data = parse(readFileSync(join(dir, name), 'utf8')) ?? {};
    for (const [slot, list] of Object.entries(data)) if (Array.isArray(list)) reviews[slot] = list as Choice[];
  }
  const picks: Pick[] = [];
  const words: Record<string, Words & { slot: string; for: string }> = {};
  const problems: string[] = [];
  for (const { slot, candidates } of all) {
    const choices = reviews[slot.id];
    if (!choices) {
      problems.push(`${slot.id}: not reviewed`);
      continue;
    }
    const ids = slotFileIds(slot);
    const used = new Set<number>();
    choices.slice(0, slot.n).forEach((choice, i) => {
      const candidate = candidates[choice.k - 1];
      if (!candidate) return problems.push(`${slot.id}: no candidate ${choice.k}`);
      if (used.has(choice.k)) return problems.push(`${slot.id}: candidate ${choice.k} twice`);
      if (!choice.title || !choice.truth) return problems.push(`${slot.id}: candidate ${choice.k} lacks a title or truth`);
      used.add(choice.k);
      const id = ids[i]!;
      if (DROPPED.has(id)) return;
      picks.push({ id, slot: slot.id, type: slot.type, as: slot.as[i]!, candidate });
      words[id] = {
        title: choice.title.trim(),
        ...(choice.description?.trim() ? { description: choice.description.trim() } : {}),
        truth: choice.truth.trim(),
        people: choice.people === 'incidental' ? 'incidental' : 'none',
        slot: slot.id,
        for: slot.for,
      };
    });
    if (choices.length < slot.n) problems.push(`${slot.id}: ${choices.length} of ${slot.n} chosen`);
  }

  // Pictures published in other formats than JPEG, so the archive has enough
  // of each: chosen by a hash of the id, the same every run.
  for (const pick of picks) {
    if (pick.type !== 'image' || pick.as !== 'jpg') continue;
    const bucket = createHash('sha1').update(pick.id).digest()[0]! % 100;
    if (bucket < 5) pick.as = 'webp';
    else if (bucket < 8) pick.as = 'avif';
    else if (bucket < 10) pick.as = 'png';
  }
  // Short looping GIFs cut from some of the videos.
  for (const id of LOOPS) {
    const video = picks.find((p) => p.id === id);
    if (!video) {
      problems.push(`loop of ${id}: no such video`);
      continue;
    }
    const w = words[id]!;
    picks.push({ ...video, id: `${id}-loop`, type: 'loop', as: 'gif' });
    words[`${id}-loop`] = {
      ...w,
      title: `${w.title}, looping`,
      description: undefined,
      truth: `${w.truth.replace(/\.$/, '')} (a few seconds of it, looping)`,
    };
    delete words[`${id}-loop`]!.description;
  }
  writeFileSync(join(WORK, 'picks.json'), JSON.stringify(picks, null, 1));
  writeFileSync(join(WORK, 'words.json'), JSON.stringify(words, null, 1));
  console.log(`${picks.length} files picked`);
  for (const problem of problems) console.log(`  ! ${problem}`);
}
