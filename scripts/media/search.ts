// Step 1: for every slot of slots.yaml, ask Commons for files that fit and
// keep the best few (the slot's count and some spares), in the order Commons'
// search ranks them. Writes media-work/candidates.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { api, licenceOf, plain, WORK } from './commons';

export type SlotType = 'image' | 'video' | 'audio' | 'pdf' | 'svg' | 'png' | 'gif';

export interface Slot {
  id: string;
  q: string;
  n: number;
  type: SlotType;
  as: string[];
  qi: boolean;
  x: string;
  for: string;
}

export interface Candidate {
  title: string;
  page: string;
  url: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  duration: number;
  pages: number;
  frames: number;
  thumb: string;
  derivatives: { key: string; url: string; width: number; height: number; bandwidth: number }[];
  licence: { id: string; url: string; short: string };
  author: string;
  credit: string;
  description: string;
  categories: string[];
  qi: boolean;
}

const DEFAULT_AS: Record<SlotType, string> = {
  image: 'jpg', png: 'png', svg: 'svg', gif: 'gif', video: 'mp4', audio: 'mp3', pdf: 'pdf',
};

export function readSlots(): Slot[] {
  const raw = parse(readFileSync(join(import.meta.dir, 'slots.yaml'), 'utf8')) as Record<string, unknown>[];
  const ids = new Set<string>();
  return raw.map((item) => {
    const type = (item.type as SlotType) ?? 'image';
    const n = Number(item.n ?? 1);
    const as = Array.isArray(item.as)
      ? (item.as as string[])
      : Array.from({ length: n }, () => (item.as as string) ?? DEFAULT_AS[type]);
    if (as.length !== n) throw new Error(`slot ${item.id}: ${as.length} formats for ${n} files`);
    if (ids.has(item.id as string)) throw new Error(`slot ${item.id} twice`);
    ids.add(item.id as string);
    return {
      id: item.id as string,
      q: item.q as string,
      n,
      type,
      as,
      qi: type === 'image' ? item.qi !== false : false,
      x: (item.x as string) ?? '',
      for: (item.for as string) ?? '',
    };
  });
}

/** The ids a slot gives its files. */
export function slotFileIds(slot: Slot): string[] {
  return slot.n === 1 ? [slot.id] : Array.from({ length: slot.n }, (_, i) => `${slot.id}-${i + 1}`);
}

const FILTER: Record<SlotType, string> = {
  image: 'filemime:image/jpeg',
  png: 'filemime:image/png',
  svg: 'filemime:image/svg+xml',
  gif: 'filemime:image/gif',
  video: 'filetype:video',
  audio: 'filetype:audio',
  pdf: 'filemime:application/pdf',
};

const PEOPLE =
  /\b(people|persons?|portraits?|men|women|girls?|boys?|child|children|kids?|babies|baby|selfies?|crowds?|tourists?|hikers?|walkers?|climbers?|mountaineers?|musicians?|cellists?|violinists?|accordionists?|pianists?|players?|performers?|performances?|actors?|actresses|singers?|nudes?|nudity|brides?|grooms?|families|couples?|pilgrims?|dancers?|runners?|athletes?|swimmers?|bathers?|workers?|fishermen|students?|police|soldiers?|politicians?|celebrities|models?|cosplay|named people|living people|demonstrations?|protests?|sports? events?|marathons?|parades?)\b/i;
const LOGO = /\b(logos?|trademarks?|brands?|wordmarks?|coats? of arms|flags?)\b/i;
const EXCLUDED_CATEGORY = /\b(nsfw|erotic|weapons?|guns?|death|dead|corpses?|blood|war|military)\b/i;

const META =
  'LicenseShortName|License|LicenseUrl|Artist|Credit|Restrictions|Categories|ImageDescription|ObjectName|AttributionRequired';

function candidateOf(page: any, slot: Slot, qi: boolean): Candidate | undefined {
  const info = (page.videoinfo ?? page.imageinfo)?.[0];
  if (!info) return undefined;
  const meta = info.extmetadata ?? {};
  const licence = licenceOf(meta);
  if (!licence) return undefined;
  if (/personality/i.test(meta.Restrictions?.value ?? '')) return undefined;
  if (/trademark/i.test(meta.Restrictions?.value ?? '')) return undefined;
  const categories = String(meta.Categories?.value ?? '').split('|').filter(Boolean);
  const words = `${page.title} ${categories.join(' | ')}`;
  if (PEOPLE.test(words) || LOGO.test(words) || EXCLUDED_CATEGORY.test(words)) return undefined;
  const metadata: { name: string; value: unknown }[] = info.metadata ?? [];
  const frames = Number(metadata.find((m) => m.name === 'frameCount')?.value ?? 0);
  const candidate: Candidate = {
    title: page.title,
    page: info.descriptionurl,
    url: info.url,
    mime: info.mime,
    bytes: info.size,
    width: info.width ?? 0,
    height: info.height ?? 0,
    duration: info.duration ?? 0,
    pages: info.pagecount ?? 0,
    frames,
    thumb: info.thumburl ?? '',
    derivatives: (info.derivatives ?? []).map((d: any) => ({
      key: d.transcodekey ?? 'original',
      url: d.src,
      width: d.width,
      height: d.height,
      bandwidth: d.bandwidth,
    })),
    licence,
    author: plain(meta.Artist?.value).slice(0, 300),
    credit: plain(meta.Credit?.value).slice(0, 300),
    description: plain(meta.ImageDescription?.value).slice(0, 600),
    categories: categories.slice(0, 20),
    qi,
  };
  const long = Math.max(candidate.width, candidate.height);
  switch (slot.type) {
    case 'image':
      if (long < 1920) return undefined;
      break;
    case 'png':
      if (long < 800 || candidate.bytes > 30_000_000) return undefined;
      break;
    case 'svg':
      if (candidate.bytes > 3_000_000) return undefined;
      break;
    case 'gif':
      if (candidate.frames < 2 || candidate.bytes > 10_000_000 || long < 200) return undefined;
      break;
    case 'video':
      if (candidate.duration < 4 || candidate.duration > 1200 || candidate.width < 640) return undefined;
      break;
    case 'audio':
      if (candidate.duration < 4 || candidate.duration > 900) return undefined;
      break;
    case 'pdf':
      if (candidate.bytes > 25_000_000) return undefined;
      break;
  }
  if (!candidate.author && !['PD', 'CC0-1.0'].includes(licence.id)) return undefined;
  return candidate;
}

async function searchOnce(slot: Slot, qi: boolean): Promise<Candidate[]> {
  const search = [slot.q, FILTER[slot.type], qi ? 'incategory:Quality_images' : '', slot.x].filter(Boolean).join(' ');
  const video = slot.type === 'video';
  const prefix = video ? 'vi' : 'ii';
  const params: Record<string, string> = {
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '50',
    gsrsearch: search,
    prop: video ? 'videoinfo' : 'imageinfo',
    [`${prefix}prop`]: `url|size|mime|mediatype|extmetadata${video ? '|derivatives' : ''}${slot.type === 'gif' ? '|metadata' : ''}`,
    [`${prefix}urlwidth`]: '330',
    [`${prefix}extmetadatafilter`]: META,
  };
  const answer = await api(params);
  const pages: any[] = answer.query?.pages ?? [];
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return pages.flatMap((page) => candidateOf(page, slot, qi) ?? []);
}

export interface SlotCandidates {
  slot: Slot;
  candidates: Candidate[];
}

export async function searchAll(): Promise<SlotCandidates[]> {
  const slots = readSlots();
  const taken = new Set<string>();
  const result: SlotCandidates[] = [];
  for (const [index, slot] of slots.entries()) {
    const want = slot.n + Math.max(3, Math.ceil(slot.n * 0.6));
    const picked: Candidate[] = [];
    const authors = new Map<string, number>();
    const consider = (list: Candidate[]) => {
      for (const candidate of list) {
        if (picked.length >= want) return;
        if (taken.has(candidate.title)) continue;
        const author = candidate.author.slice(0, 40).toLowerCase();
        if ((authors.get(author) ?? 0) >= Math.max(2, Math.ceil(slot.n / 2))) continue;
        authors.set(author, (authors.get(author) ?? 0) + 1);
        picked.push(candidate);
        taken.add(candidate.title);
      }
    };
    if (slot.qi) consider(await searchOnce(slot, true));
    if (picked.length < want) consider(await searchOnce(slot, false));
    const short = picked.length < slot.n ? `  ✗ only ${picked.length} of ${slot.n}` : '';
    console.log(`[${index + 1}/${slots.length}] ${slot.id}: ${picked.length} (${picked.filter((c) => c.qi).length} QI)${short}`);
    result.push({ slot, candidates: picked });
  }
  mkdirSync(WORK, { recursive: true });
  writeFileSync(join(WORK, 'candidates.json'), JSON.stringify(result, null, 1));
  return result;
}

if (import.meta.main) await searchAll();
