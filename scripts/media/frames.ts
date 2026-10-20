// Contact sheets of the built videos: four frames of each, across its
// length, one video a row, so a reviewer can see what a video shows all the
// way through. Writes media-work/frames/videos-NN.jpg.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { WORK } from './commons';
import { MEDIA } from './build';

const W = 320;
const H = 180;
const LABEL = 30;
const PER_SHEET = 8;

const videos = readdirSync(MEDIA).filter((n) => /\.(mp4|webm|mov)$/.test(n)).sort();
mkdirSync(join(WORK, 'frames'), { recursive: true });
const rows: Buffer[] = [];
for (const name of videos) {
  const path = join(MEDIA, name);
  const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], { encoding: 'utf8' }));
  const frames: Buffer[] = [];
  for (const at of [0.1, 0.35, 0.65, 0.95]) {
    const out = execFileSync('ffmpeg', ['-v', 'error', '-ss', String((duration * at).toFixed(2)), '-i', path, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], { maxBuffer: 64 * 1024 * 1024 });
    frames.push(await sharp(out).resize(W, H, { fit: 'contain', background: '#202020' }).toBuffer());
  }
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W * 4}" height="${LABEL}"><rect width="100%" height="100%" fill="#fff"/><text x="6" y="21" font-family="Arial" font-size="18" font-weight="bold">${name} · ${duration.toFixed(0)} s</text></svg>`);
  rows.push(
    await sharp({ create: { width: W * 4, height: H + LABEL, channels: 3, background: '#000' } })
      .composite([{ input: label, top: 0, left: 0 }, ...frames.map((input, i) => ({ input, top: LABEL, left: i * W }))])
      .png()
      .toBuffer(),
  );
}
for (let start = 0, n = 1; start < rows.length; start += PER_SHEET, n++) {
  const part = rows.slice(start, start + PER_SHEET);
  await sharp({ create: { width: W * 4, height: part.length * (H + LABEL), channels: 3, background: '#000' } })
    .composite(part.map((input, i) => ({ input, top: i * (H + LABEL), left: 0 })))
    .jpeg({ quality: 78 })
    .toFile(join(WORK, 'frames', `videos-${String(n).padStart(2, '0')}.jpg`));
}
console.log(`${videos.length} videos, ${Math.ceil(rows.length / PER_SHEET)} sheets`);
