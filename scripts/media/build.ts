// Step 4: for every picked file, download what Commons serves (a thumbnail
// of the right size for pictures, a smaller transcode for videos, the
// original for the rest) into media-work/raw/, and make the published file
// media/<id>.<ext> from it. What was done is recorded in
// media-work/built/<id>.json, which describe.ts reads.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { download, WORK } from './commons';
import type { Candidate } from './search';

export const MEDIA = join(import.meta.dir, '..', '..', 'media');
const LONG_SIDE = 1920;
const VIDEO_LIMIT = 15_000_000;

export interface Pick {
  id: string;
  slot: string;
  type: string;
  as: string;
  candidate: Candidate;
}

export interface Built {
  id: string;
  ext: string;
  download: string;
  retrieved: string;
  transform: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

function ffmpeg(args: string[]) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
}

function probe(path: string): { width?: number; height?: number; duration?: number; audio: boolean } {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', path], {
    encoding: 'utf8',
  });
  const json = JSON.parse(out);
  const video = json.streams?.find((s: any) => s.codec_type === 'video');
  return {
    width: video?.width,
    height: video?.height,
    duration: json.format?.duration ? Number(Number(json.format.duration).toFixed(2)) : undefined,
    audio: Boolean(json.streams?.some((s: any) => s.codec_type === 'audio')),
  };
}

/** The thumbnail width that gives a long side of at least 1920, or the original. */
function pictureSource(c: Candidate): { url: string; note: string } {
  const landscape = c.width >= c.height;
  const steps = [1280, 1920, 2560, 3840];
  const needed = landscape ? LONG_SIDE : Math.ceil((LONG_SIDE * c.width) / c.height);
  const width = steps.find((w) => w >= needed) ?? 3840;
  if (width >= c.width || !c.thumb) return { url: c.url.split('?')[0]!, note: 'original' };
  return { url: c.thumb.split('?')[0]!.replace(/\/330px-/, `/${width}px-`), note: `${width}px thumbnail` };
}

function videoSource(c: Candidate): { url: string; note: string } {
  const fits = (d: Candidate['derivatives'][number]) => (d.bandwidth * c.duration) / 8 < 60_000_000;
  const order = ['1080p.vp9.webm', '720p.vp9.webm', '1080p.webm', '720p.webm', '480p.vp9.webm', '480p.webm'];
  if (c.bytes < 40_000_000) return { url: c.url.split('?')[0]!, note: 'original' };
  for (const key of order) {
    const d = c.derivatives.find((x) => x.key === key);
    if (d && fits(d)) return { url: d.url.split('?')[0]!, note: `${key} transcode` };
  }
  const smallest = [...c.derivatives].filter((d) => d.key !== 'original').sort((a, b) => a.bandwidth - b.bandwidth)[0];
  return smallest ? { url: smallest.url.split('?')[0]!, note: `${smallest.key} transcode` } : { url: c.url.split('?')[0]!, note: 'original' };
}

function extOf(url: string) {
  return url.split('?')[0]!.split('.').pop()!.toLowerCase();
}

async function buildPicture(pick: Pick, raw: string, out: string, note: string): Promise<Partial<Built>> {
  const input = sharp(raw, { animated: false }).rotate();
  const meta = await input.metadata();
  const long = Math.max(meta.width ?? 0, meta.height ?? 0);
  const resized = input.resize(LONG_SIDE, LONG_SIDE, { fit: 'inside', withoutEnlargement: true });
  const sized = long > LONG_SIDE ? `long side ${LONG_SIDE}` : `long side ${long} as published`;
  let encoding: string;
  switch (pick.as) {
    case 'webp':
      await resized.webp({ quality: 80 }).toFile(out);
      encoding = 'WebP q80';
      break;
    case 'avif':
      await resized.avif({ quality: 50, effort: 4 }).toFile(out);
      encoding = 'AVIF q50';
      break;
    case 'png':
      await resized.png({ compressionLevel: 9 }).toFile(out);
      encoding = 'PNG';
      break;
    default:
      await resized.jpeg({ quality: 85, mozjpeg: true }).toFile(out);
      encoding = 'JPEG q85';
  }
  const after = await sharp(out).metadata();
  return { transform: `from the ${note}: ${sized}, ${encoding}, metadata removed`, width: after.width, height: after.height };
}

function buildVideo(pick: Pick, raw: string, out: string, note: string): Partial<Built> {
  const source = probe(raw);
  const length = Math.min(source.duration ?? 30, 40);
  const budget = Math.floor(((VIDEO_LIMIT * 0.9 * 8) / length) / 1000); // kbit/s for everything
  const audioRate = source.audio ? 96 : 0;
  const videoRate = Math.min(4500, budget - audioRate);
  const scale = "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'";
  const common = ['-i', raw, '-t', String(length), '-vf', `${scale},fps=fps=30`, '-map_metadata', '-1'];
  const audio = source.audio ? ['-c:a', pick.as === 'webm' ? 'libopus' : 'aac', '-b:a', `${audioRate}k`] : ['-an'];
  let codec: string;
  if (pick.as === 'webm') {
    ffmpeg([...common, '-c:v', 'libvpx-vp9', '-b:v', `${videoRate}k`, '-maxrate', `${videoRate}k`, '-bufsize', `${videoRate * 2}k`, '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', ...audio, out]);
    codec = 'VP9';
  } else {
    ffmpeg([...common, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-maxrate', `${videoRate}k`, '-bufsize', `${videoRate * 2}k`, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ...audio, out]);
    codec = 'H.264';
  }
  if (statSync(out).size > VIDEO_LIMIT) throw new Error(`${pick.id}: ${statSync(out).size} bytes, over 15 MB`);
  const after = probe(out);
  const cut = (source.duration ?? 0) > length + 0.5 ? `first ${length} s, ` : '';
  return {
    transform: `from the ${note}: ${cut}long side at most 1280, ${codec}${source.audio ? ` with ${pick.as === 'webm' ? 'Opus' : 'AAC'} sound` : ', no sound'}, ${pick.as.toUpperCase()}`,
    width: after.width,
    height: after.height,
    duration: after.duration,
  };
}

function buildAudio(pick: Pick, raw: string, out: string, note: string): Partial<Built> {
  const source = probe(raw);
  const limits: Record<string, number> = { wav: 40, flac: 75, mp3: 180, ogg: 180, m4a: 180 };
  const length = Math.min(source.duration ?? 60, limits[pick.as] ?? 180);
  const cut = (source.duration ?? 0) > length + 0.5;
  const fade = cut ? ['-af', `afade=t=out:st=${Math.max(0, length - 2)}:d=2`] : [];
  const codecs: Record<string, string[]> = {
    mp3: ['-c:a', 'libmp3lame', '-q:a', '2'],
    ogg: ['-c:a', 'libvorbis', '-q:a', '5'],
    m4a: ['-c:a', 'aac', '-b:a', '160k'],
    flac: ['-c:a', 'flac', '-ar', '44100', '-sample_fmt', 's16'],
    wav: ['-c:a', 'pcm_s16le', '-ar', '44100'],
  };
  ffmpeg(['-i', raw, '-vn', '-t', String(length), ...fade, '-map_metadata', '-1', ...codecs[pick.as]!, out]);
  const after = probe(out);
  const names: Record<string, string> = { mp3: 'MP3 VBR q2', ogg: 'Ogg Vorbis q5', m4a: 'AAC 160 kbit/s in M4A', flac: 'FLAC 16-bit 44.1 kHz', wav: 'WAV 16-bit 44.1 kHz' };
  const same = extOf(raw) === pick.as && !cut;
  return {
    transform: same
      ? `the original, re-encoded as ${names[pick.as]}`
      : `from the ${note}${cut ? `: first ${length} s with a 2 s fade-out` : ''}, ${names[pick.as]}`,
    duration: after.duration,
  };
}

export async function buildOne(pick: Pick): Promise<Built> {
  const done = join(WORK, 'built', `${pick.id}.json`);
  const out = join(MEDIA, `${pick.id}.${pick.as}`);
  if (existsSync(done) && existsSync(out)) return JSON.parse(readFileSync(done, 'utf8'));
  const c = pick.candidate;
  const source =
    pick.type === 'image' || (pick.type === 'png' && c.bytes > 8_000_000)
      ? pictureSource(c)
      : pick.type === 'video'
        ? videoSource(c)
        : { url: c.url.split('?')[0]!, note: 'original' };
  const raw = join(WORK, 'raw', `${pick.id}.${extOf(source.url)}`);
  await download(source.url, raw, { minBytes: 200 });
  mkdirSync(MEDIA, { recursive: true });
  let result: Partial<Built>;
  switch (pick.type) {
    case 'image':
    case 'png':
      result = await buildPicture(pick, raw, out, source.note);
      break;
    case 'video':
      result = buildVideo(pick, raw, out, source.note);
      break;
    case 'audio':
      result = buildAudio(pick, raw, out, source.note);
      break;
    case 'svg': {
      const text = readFileSync(raw, 'utf8');
      if (/<image[^>]+href=["']https?:/i.test(text)) throw new Error(`${pick.id}: the SVG loads a remote picture`);
      copyFileSync(raw, out);
      const meta = await sharp(raw).metadata().catch(() => ({ width: undefined, height: undefined }));
      result = { transform: 'the original SVG, unchanged', width: meta.width, height: meta.height };
      break;
    }
    case 'gif': {
      copyFileSync(raw, out);
      const meta = await sharp(raw).metadata();
      result = { transform: 'the original animated GIF, unchanged', width: meta.width, height: meta.pageHeight ?? meta.height };
      break;
    }
    default:
      copyFileSync(raw, out);
      result = { transform: `the original ${pick.as.toUpperCase()}, unchanged` };
  }
  const built: Built = { id: pick.id, ext: pick.as, download: source.url, retrieved: new Date().toISOString().slice(0, 10), bytes: statSync(out).size, transform: result.transform!, ...result };
  mkdirSync(join(WORK, 'built'), { recursive: true });
  writeFileSync(done, JSON.stringify(built, null, 1));
  return built;
}

export function readPicks(): Pick[] {
  return JSON.parse(readFileSync(join(WORK, 'picks.json'), 'utf8'));
}

if (import.meta.main) {
  const picks = readPicks();
  const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const todo = only.length ? picks.filter((p) => only.some((o) => p.id.startsWith(o))) : picks;
  let failed = 0;
  for (const [i, pick] of todo.entries()) {
    try {
      const built = await buildOne(pick);
      if ((i + 1) % 20 === 0 || pick.type === 'video') console.log(`[${i + 1}/${todo.length}] ${built.id}.${built.ext} ${(built.bytes / 1e6).toFixed(2)} MB`);
    } catch (error) {
      failed++;
      console.error(`✗ ${pick.id}: ${(error as Error).message}`);
    }
  }
  console.log(`done, ${failed} failed`);
}
