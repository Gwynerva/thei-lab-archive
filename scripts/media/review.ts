// Step 2: small thumbnails of every candidate and contact sheets of them,
// numbered as candidates.json numbers them, so a reviewer can look before
// anything big is downloaded. Recordings have no picture: their sheet is a
// text list. Writes media-work/thumbs/ and media-work/sheets/.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { download, WORK } from './commons';
import type { SlotCandidates } from './search';

export const GROUPS: { name: string; first: string }[] = [
  { name: 'coast-and-edinburgh', first: 'whitby-abbey' },
  { name: 'scotland-iceland-japan', first: 'ben-lomond' },
  { name: 'bergen-lofoten', first: 'nyhavn' },
  { name: 'hardanger-camino-georgia', first: 'hardangerfjord' },
  { name: 'sea-crafts', first: 'lerwick' },
  { name: 'kayak-house-food-cats', first: 'sea-kayak' },
  { name: 'music-maps-sky', first: 'cello' },
  { name: 'videos', first: 'video-waves' },
  { name: 'recordings-documents', first: 'sound-rain' },
  { name: 'top-up', first: 'leith-river' },
];

export function readCandidates(): SlotCandidates[] {
  return JSON.parse(readFileSync(join(WORK, 'candidates.json'), 'utf8'));
}

export function groupOf(all: SlotCandidates[], slotId: string): string {
  const index = all.findIndex((s) => s.slot.id === slotId);
  let group = GROUPS[0]!.name;
  for (const g of GROUPS) {
    const start = all.findIndex((s) => s.slot.id === g.first);
    if (start >= 0 && index >= start) group = g.name;
  }
  return group;
}

export function thumbPath(slot: string, k: number) {
  return join(WORK, 'thumbs', slot, `${k}.jpg`);
}

const TILE_W = 330;
const TILE_H = 250;
const LABEL_H = 34;
const COLUMNS = 5;
const ROWS = 4;

function escape(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function tile(slot: string, k: number, label: string): Promise<Buffer> {
  const path = thumbPath(slot, k);
  const base = sharp({ create: { width: TILE_W, height: TILE_H + LABEL_H, channels: 3, background: '#202020' } });
  const layers: sharp.OverlayOptions[] = [];
  if (existsSync(path)) {
    const picture = await sharp(path).resize(TILE_W, TILE_H, { fit: 'contain', background: '#202020' }).toBuffer();
    layers.push({ input: picture, top: 0, left: 0 });
  }
  layers.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${LABEL_H}"><rect width="100%" height="100%" fill="#fff"/>` +
        `<text x="6" y="23" font-family="Arial" font-size="18" font-weight="bold" fill="#000">${escape(label)}</text></svg>`,
    ),
    top: TILE_H,
    left: 0,
  });
  return base.composite(layers).jpeg({ quality: 82 }).toBuffer();
}

export async function makeThumbs(all: SlotCandidates[]) {
  let count = 0;
  for (const { slot, candidates } of all) {
    for (const [i, candidate] of candidates.entries()) {
      if (!candidate.thumb) continue;
      const url = candidate.thumb.split('?')[0]!;
      try {
        await download(url, thumbPath(slot.id, i + 1));
      } catch (error) {
        console.warn(`  no thumb for ${slot.id} ${i + 1}: ${(error as Error).message}`);
      }
      if (++count % 50 === 0) console.log(`  ${count} thumbs`);
    }
  }
}

export async function makeSheets(all: SlotCandidates[]) {
  mkdirSync(join(WORK, 'sheets'), { recursive: true });
  const byGroup = new Map<string, { slot: string; k: number }[]>();
  const lists = new Map<string, string[]>();
  for (const { slot, candidates } of all) {
    const group = groupOf(all, slot.id);
    const lines = lists.get(group) ?? [];
    lines.push(`## ${slot.id} — wants ${slot.n} (${slot.type}${slot.for ? `; for: ${slot.for}` : ''}) — search "${slot.q}"`);
    candidates.forEach((c, i) => {
      const size =
        slot.type === 'audio' || slot.type === 'video'
          ? `${Math.round(c.duration)} s`
          : slot.type === 'pdf'
            ? `${c.pages || '?'} pages, ${(c.bytes / 1e6).toFixed(1)} MB`
            : `${c.width}×${c.height}`;
      lines.push(
        `${i + 1}. ${c.title.replace(/^File:/, '')} · ${size} · ${c.licence.short}${c.qi ? ' · QI' : ''}\n` +
          `   desc: ${c.description.split('.mw-parser-output')[0]!.replace(/\s+/g, ' ').trim().slice(0, 260) || '—'}\n   cats: ${c.categories.slice(0, 8).join('; ')}`,
      );
      if (c.thumb) {
        const tiles = byGroup.get(group) ?? [];
        tiles.push({ slot: slot.id, k: i + 1 });
        byGroup.set(group, tiles);
      }
    });
    lists.set(group, lines);
  }
  for (const [group, lines] of lists) writeFileSync(join(WORK, 'sheets', `${group}.md`), `${lines.join('\n')}\n`);
  for (const [group, tiles] of byGroup) {
    const perSheet = COLUMNS * ROWS;
    for (let start = 0, sheet = 1; start < tiles.length; start += perSheet, sheet++) {
      const part = tiles.slice(start, start + perSheet);
      const rows = Math.ceil(part.length / COLUMNS);
      const images = await Promise.all(part.map((t) => tile(t.slot, t.k, `${t.slot} ${t.k}`)));
      const out = join(WORK, 'sheets', `${group}-${String(sheet).padStart(2, '0')}.jpg`);
      await sharp({
        create: { width: COLUMNS * TILE_W, height: rows * (TILE_H + LABEL_H), channels: 3, background: '#000' },
      })
        .composite(images.map((input, i) => ({ input, left: (i % COLUMNS) * TILE_W, top: Math.floor(i / COLUMNS) * (TILE_H + LABEL_H) })))
        .jpeg({ quality: 80 })
        .toFile(out);
    }
    console.log(`  ${group}: ${tiles.length} tiles, ${Math.ceil(tiles.length / perSheet)} sheets`);
  }
}

if (import.meta.main) {
  const all = readCandidates();
  if (!process.argv.includes('--sheets-only')) await makeThumbs(all);
  await makeSheets(all);
}
