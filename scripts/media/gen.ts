// The files Commons has no kind of: Mira's own data and notes, made here —
// weather readings, a practice log, budgets, GPS tracks, tide predictions,
// notes, and archives of small projects. All fictional, the same bytes on
// every run (a seeded random), CC0. Writes media/<id>.<ext> and
// files/<id>.yaml.
import { deflateRawSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MEDIA } from './build';
import { FILES, fileYaml, kindOf } from './describe';

// ------------------------------------------------------------------ helpers
let seed = 20161001;
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const pad = (n: number) => String(n).padStart(2, '0');

function days(start: string, count: number): string[] {
  const [y, m, d] = start.split('-').map(Number) as [number, number, number];
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10));
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A zip of text files, deflated, with a fixed date so the bytes never change. */
function zip(entries: Record<string, string>, date = new Date(Date.UTC(2020, 0, 1))): Buffer {
  const dosTime = 0;
  const dosDate = ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const data = Buffer.from(text, 'utf8');
    const packed = deflateRawSync(data, { level: 9 });
    const nameBytes = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBytes, packed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);
    offset += 30 + nameBytes.length + packed.length;
  }
  const centralBytes = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBytes, end]);
}

function csv(rows: (string | number)[][]): string {
  return `${rows.map((row) => row.map((cell) => (typeof cell === 'string' && /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(',')).join('\n')}\n`;
}

/** A walk between waypoints as a GeoJSON line, a little wobbly like a real track. */
function track(name: string, day: string, points: [number, number][], steps = 30): string {
  const coords: [number, number, number][] = [];
  let elevation = 20 + random() * 30;
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i]!;
    const [bx, by] = points[i + 1]!;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      elevation = Math.max(2, elevation + (random() - 0.48) * 12);
      coords.push([round(ax + (bx - ax) * t + (random() - 0.5) * 0.0012, 5), round(ay + (by - ay) * t + (random() - 0.5) * 0.0012, 5), round(elevation, 0)]);
    }
  }
  coords.push([...points.at(-1)!, round(elevation, 0)] as [number, number, number]);
  return `${JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name, day, source: 'phone GPS, thinned to one point a minute' }, geometry: { type: 'LineString', coordinates: coords } }] }, null, 1)}\n`;
}

// --------------------------------------------------------------- the files
interface Made {
  id: string;
  ext: string;
  title: string;
  description?: string;
  truth: string;
  bytes: string | Buffer;
}
const made: Made[] = [];
const add = (file: Made) => made.push(file);

// Weather station readings (hourly), Leith 2020–2021 and Bergen 2022.
function weather(id: string, title: string, start: string, count: number, base: { t: number; rain: number; p: number }, description?: string) {
  const rows: (string | number)[][] = [['time', 'temperature_c', 'humidity_pct', 'pressure_hpa', 'rain_mm']];
  let pressure = base.p;
  for (const day of days(start, count)) {
    for (let h = 0; h < 24; h++) {
      pressure = Math.min(1040, Math.max(965, pressure + (random() - 0.5) * 1.6));
      const t = base.t + 4 * Math.sin(((h - 9) / 24) * 2 * Math.PI) + (random() - 0.5) * 2;
      const rain = random() < base.rain ? round(random() * 2.4, 1) : 0;
      rows.push([`${day}T${pad(h)}:00`, round(t), Math.round(70 + random() * 25), round(pressure), rain]);
    }
  }
  add({ id, ext: 'csv', title, description, truth: `a generated CSV of fictional hourly weather readings (${rows.length - 1} rows from ${start}), made for the archive`, bytes: csv(rows) });
}
weather('weather-leith-2020-06', 'Balcony weather, June 2020', '2020-06-14', 17, { t: 14, rain: 0.06, p: 1016 }, 'The first seventeen days of the balcony station, hour by hour.');
weather('weather-leith-2020-12', 'Balcony weather, December 2020', '2020-12-01', 31, { t: 4, rain: 0.12, p: 1008 });
weather('weather-leith-2021-03', 'Balcony weather, March 2021', '2021-03-01', 31, { t: 7, rain: 0.1, p: 1012 });
weather('weather-bergen-2022-10', 'Sandviken weather, October 2022', '2022-10-01', 31, { t: 9, rain: 0.42, p: 1001 }, 'The month of the twenty-one wet days, from the station on the kitchen window.');

{
  const rows: (string | number)[][] = [['day', 'rain_mm', 'wet']];
  let streak = 0;
  for (const day of days('2022-10-01', 182)) {
    const inStreak = day >= '2022-10-03' && day <= '2022-10-23';
    const mm = inStreak ? round(2 + random() * 28, 1) : random() < 0.6 ? round(random() * 18, 1) : 0;
    streak = mm > 0.2 ? streak + 1 : 0;
    rows.push([day, mm, mm > 0.2 ? 'yes' : 'no']);
  }
  add({ id: 'rain-counter-export', ext: 'csv', title: 'Rain counter export', description: 'Every day from October 2022 to March 2023: millimetres, and whether it counts as wet.', truth: 'a generated CSV of fictional daily rainfall for six months, made for the archive', bytes: csv(rows) });
}

{
  const rows: (string | number)[][] = [['day', 'minutes', 'what', 'mood']];
  const what = ['scales', 'open strings', 'bowing', 'Minuet', 'thumb position', 'orchestra part', 'shifting'];
  const moods = ['fine', 'good', 'awful', 'better', 'sore fingers', 'tired', 'lovely'];
  for (const day of days('2018-02-05', 60)) {
    const minutes = random() < 0.15 ? 0 : Math.round(15 + random() * 45);
    rows.push([day, minutes, minutes ? what[Math.floor(random() * what.length)]! : '', minutes ? moods[Math.floor(random() * moods.length)]! : 'skipped']);
  }
  add({ id: 'practice-log-2018', ext: 'csv', title: 'Sixty days of practice', truth: 'a generated CSV of a fictional cello practice log, 60 days', bytes: csv(rows) });
}

add({
  id: 'budget-2017',
  ext: 'csv',
  title: 'Leith budget, 2017',
  truth: 'a generated CSV of a fictional monthly household budget in pounds',
  bytes: csv([
    ['month', 'rent', 'food', 'bike', 'books_and_paper', 'cello', 'savings'],
    ...['2017-09', '2017-10', '2017-11', '2017-12'].map((m) => [m, 425, Math.round(160 + random() * 60), Math.round(random() * 40), Math.round(10 + random() * 50), 0, Math.round(80 + random() * 120)]),
  ]),
});
add({
  id: 'budget-2022',
  ext: 'csv',
  title: 'Budget in kroner, 2022',
  truth: 'a generated CSV of a fictional monthly household budget in Norwegian kroner',
  bytes: csv([
    ['month', 'rent_nok', 'food_nok', 'transport_nok', 'kayak_nok', 'orchestra_nok', 'savings_nok'],
    ...Array.from({ length: 12 }, (_, i) => [`2022-${pad(i + 1)}`, 11800, Math.round(4200 + random() * 1500), 890, Math.round(random() * 3500), 350, Math.round(3000 + random() * 4000)]),
  ]),
});
add({
  id: 'house-costs-2025',
  ext: 'csv',
  title: 'What the house cost in 2025',
  truth: 'a generated CSV of fictional renovation costs in Norwegian kroner',
  bytes: csv([
    ['date', 'what', 'nok'],
    ['2025-04-15', 'roof survey', 4500],
    ['2025-05-14', 'water test', 1890],
    ['2025-06-02', 'window putty, glass, paint', 6340],
    ['2025-07-11', 'scaffolding, two weeks', 9800],
    ['2025-09-19', 'wood-fibre insulation', 23400],
    ['2025-09-30', 'roofer, the leak over the stairs', 7200],
    ['2025-10-18', 'stove and chimney liner', 31900],
    ['2025-11-03', 'skip for the old kitchen', 3600],
    ['2026-01-20', 'kitchen worktop, oak', 14250],
    ['2026-03-21', 'electrician', 12800],
  ]),
});
add({
  id: 'munro-list',
  ext: 'csv',
  title: 'Munros climbed',
  description: 'The thirty-four, in order, with heights in metres.',
  truth: 'a generated CSV listing real Scottish mountains with their heights and fictional dates of ascent',
  bytes: csv([
    ['n', 'date', 'munro', 'height_m'],
    [1, '2017-05-06', 'Ben Lomond', 974],
    [2, '2017-06-17', 'Ben Vorlich (Loch Earn)', 985],
    [3, '2017-07-29', 'Meall nan Tarmachan', 1044],
    [4, '2017-08-26', 'Ben Chonzie', 931],
    [5, '2017-09-24', 'Bla Bheinn', 928],
    [6, '2017-10-28', 'Stob Binnein', 1165],
    [7, '2018-04-21', 'Ben More', 1174],
    [8, '2018-06-16', 'Buachaille Etive Beag: Stob Dubh', 958],
    [9, '2018-07-07', 'Bidean nam Bian', 1150],
    [10, '2018-08-11', 'Schiehallion', 1083],
    [11, '2018-09-15', 'Cairn Gorm', 1245],
    [12, '2018-09-16', 'Ben Macdui', 1309],
    [13, '2018-10-13', 'Ben Vane', 915],
    [14, '2019-05-11', 'Beinn Ghlas', 1103],
    [15, '2019-05-25', 'Ben Ledi', 879],
    [16, '2019-06-08', 'Stuc a\' Chroin', 975],
    [17, '2019-07-27', 'Beinn Dorain', 1076],
    [18, '2019-08-03', 'Beinn an Dothaidh', 1004],
    [19, '2019-08-17', 'Ben Challum', 1025],
    [20, '2019-08-31', 'Ben Lawers', 1214],
    [21, '2019-09-14', 'Lochnagar', 1155],
    [22, '2019-09-28', 'Mount Keen', 939],
    [23, '2020-06-27', 'Ben Oss', 1029],
    [24, '2020-07-11', 'Ben Vorlich (Loch Lomond)', 943],
    [25, '2020-08-08', 'Beinn Ime', 1011],
    [26, '2020-08-29', 'Ben Narnain', 1006],
    [27, '2020-09-05', 'Carn Liath', 975],
    [28, '2021-04-24', 'Driesh', 947],
    [29, '2021-04-25', 'Mayar', 928],
    [30, '2021-05-15', 'Ben Lui', 1130],
    [31, '2021-05-29', 'Beinn a\' Ghlo: Braigh Coire Chruinn-bhalgain', 1070],
    [32, '2021-06-12', 'Sgurr nan Gillean (with a guide)', 964],
    [33, '2021-06-19', 'Aonach Mor', 1221],
    [34, '2021-07-03', 'Ben Nevis', 1345],
  ]),
});
{
  const rows: (string | number)[][] = [['variety', 'kg', 'litres', 'sg_start']];
  for (const [variety, kg] of [['Gravenstein', 96], ['Aroma', 120], ['Summerred', 58], ['Discovery', 44], ['unknown, the tree by the barn', 71]] as const)
    rows.push([variety, kg, round(kg * 0.55, 0), round(1.045 + random() * 0.012, 3)]);
  add({ id: 'cider-2025', ext: 'csv', title: 'Pressing log, 2025', description: 'Apples by variety, juice, and the gravity before fermenting.', truth: 'a generated CSV of a fictional cider pressing log', bytes: csv(rows) });
}
{
  const rows: (string | number)[][] = [['week', 'km', 'long_run_km', 'note']];
  for (let w = 1; w <= 16; w++) rows.push([w, round(14 + w * 1.6 + (random() - 0.5) * 4), round(6 + w * 0.8, 1), w === 9 ? 'calf twinge' : w === 16 ? 'taper' : '']);
  add({ id: 'training-plan', ext: 'csv', title: 'Sixteen weeks of running', truth: 'a generated CSV of a fictional half-marathon training log', bytes: csv(rows) });
}

// GPS tracks (GeoJSON), approximate, along real routes.
add({ id: 'track-camino-porto', ext: 'json', title: 'Track: Porto to Vila do Conde', description: 'The first day of the Camino, along the coast.', truth: 'a generated GeoJSON line roughly following the Portuguese coast from Porto to Vila do Conde, with fictional elevations', bytes: track('Porto – Vila do Conde', '2024-06-08', [[-8.6141, 41.1413], [-8.6766, 41.1550], [-8.7057, 41.2101], [-8.7234, 41.2713], [-8.7451, 41.3497]]) });
add({ id: 'track-camino-baiona', ext: 'json', title: 'Track: A Guarda to Baiona', truth: 'a generated GeoJSON line roughly following the Galician coast from A Guarda to Baiona', bytes: track('A Guarda – Baiona', '2024-06-14', [[-8.8739, 41.9012], [-8.8746, 41.9601], [-8.8607, 42.0381], [-8.8418, 42.1180]]) });
add({ id: 'track-svaneti-day-1', ext: 'json', title: 'Track: Mestia to Zhabeshi', truth: 'a generated GeoJSON line roughly between Mestia and Zhabeshi in Svaneti, Georgia', bytes: track('Mestia – Zhabeshi', '2025-09-09', [[42.7275, 43.0451], [42.6780, 43.0602], [42.6301, 43.0650], [42.5809, 43.0567]]) });
add({ id: 'track-svaneti-day-3', ext: 'json', title: 'Track: Adishi to Iprari', description: 'Over the Chkhutnieri pass, and through the river.', truth: 'a generated GeoJSON line roughly between Adishi and Iprari in Svaneti, Georgia', bytes: track('Adishi – Iprari', '2025-09-11', [[42.8590, 43.0137], [42.8916, 42.9781], [42.9310, 42.9545], [42.9737, 42.9452]]) });
add({ id: 'track-kumano-kodo', ext: 'json', title: 'Track: Takijiri to Takahara', truth: 'a generated GeoJSON line roughly along the Kumano Kodo from Takijiri to Takahara, Japan', bytes: track('Takijiri – Takahara', '2019-04-09', [[135.5245, 33.7900], [135.5340, 33.7963], [135.5428, 33.8051], [135.5511, 33.8101]]) });

{
  // tideline's output: a month of high and low waters at Whitby, from four constituents.
  const constituents = [
    { name: 'M2', amplitude: 1.95, speed: 28.984104, phase: 112 },
    { name: 'S2', amplitude: 0.66, speed: 30.0, phase: 154 },
    { name: 'K1', amplitude: 0.13, speed: 15.041069, phase: 255 },
    { name: 'O1', amplitude: 0.16, speed: 13.943035, phase: 82 },
  ];
  const height = (hours: number) => 3.1 + constituents.reduce((h, c) => h + c.amplitude * Math.cos(((c.speed * hours - c.phase) * Math.PI) / 180), 0);
  const events: { time: string; kind: string; height_m: number }[] = [];
  const start = Date.UTC(2018, 3, 1);
  let previous = height(0);
  let rising = height(0.1) > previous;
  for (let minute = 6; minute < 30 * 24 * 60; minute += 6) {
    const h = height(minute / 60);
    const nowRising = h > previous;
    if (nowRising !== rising) events.push({ time: new Date(start + (minute - 6) * 60000).toISOString().slice(0, 16), kind: rising ? 'high' : 'low', height_m: round(previous, 2) });
    rising = nowRising;
    previous = h;
  }
  add({ id: 'tides-whitby-2018-04', ext: 'json', title: 'Whitby tides, April 2018', description: 'High and low waters for a month, as tideline 1.0 predicted them.', truth: 'a generated JSON of fictional tide predictions computed from four approximate harmonic constituents; not for navigation', bytes: `${JSON.stringify({ station: 'Whitby', datum: 'chart datum', generator: 'tideline 1.0', constituents, events }, null, 1)}\n` });
}
add({ id: 'station-config', ext: 'json', title: 'Weather station settings', truth: 'a generated JSON of fictional sensor settings for a home weather station', bytes: `${JSON.stringify({ name: 'balcony', interval_minutes: 10, sensors: { temperature: { type: 'BME280', offset_c: -0.4 }, rain: { type: 'tipping bucket', mm_per_tip: 0.2794 }, wind: { enabled: false, reason: 'the landlord said no to the mast' } }, upload: { enabled: true, retry_minutes: 30 } }, null, 2)}\n` });
add({ id: 'plotter-settings', ext: 'json', title: 'Plotter settings', truth: 'a generated JSON of fictional pen-plotter settings', bytes: `${JSON.stringify({ paper: 'A3', pen: 'fountain pen, fine nib', speed_mm_s: 35, pen_up_deg: 60, pen_down_deg: 30, contour_interval_m: 10, simplify_m: 1.5 }, null, 2)}\n` });
add({
  id: 'sound-map',
  ext: 'json',
  title: 'Map of the recordings',
  description: 'Where each Bergen recording was made.',
  truth: 'a generated GeoJSON of fictional recording places in Bergen',
  bytes: `${JSON.stringify({ type: 'FeatureCollection', features: [
    ['Rain on the roof, Sandviken', 5.3268, 60.4089, '2022-10-08'],
    ['Bells at noon', 5.3247, 60.3974, '2023-01-14'],
    ['Gulls over Vågen', 5.3229, 60.3966, '2023-04-22'],
    ['The fish market, early', 5.3245, 60.3949, '2023-05-06'],
    ['A ferry leaving', 5.3105, 60.3982, '2023-06-03'],
    ['Oystercatchers at Nordnes', 5.3027, 60.3992, '2024-04-13'],
    ['Wind on Fløyen', 5.3445, 60.3948, '2024-05-18'],
  ].map(([name, x, y, day]) => ({ type: 'Feature', properties: { name, day }, geometry: { type: 'Point', coordinates: [x, y] } })) }, null, 1)}\n`,
});
add({
  id: 'atlas-walks',
  ext: 'json',
  title: 'The thirty walks',
  truth: 'a generated JSON listing thirty fictional walks around the Hardangerfjord with lengths and climbs',
  bytes: `${JSON.stringify(Array.from({ length: 30 }, (_, i) => ({ n: i + 1, name: ['Utne shore', 'Above the orchards', 'To the old summer farm', 'Vøringsfossen rim', 'The fjord path', 'Folgefonna view', 'Kinsarvik falls', 'The church road', 'Lofthus monks\' steps', 'Along the river'][i % 10] + (i >= 10 ? ` ${i >= 20 ? 'III' : 'II'}` : ''), km: round(3 + random() * 14, 1), climb_m: Math.round(50 + random() * 900), grade: ['easy', 'moderate', 'hard'][Math.floor(random() * 3)] })), null, 1)}\n`,
});

// Notes.
add({ id: 'packing-list', ext: 'txt', title: 'Packing list for the hills', truth: 'a generated plain-text packing list', bytes: 'HILLS — what goes in the bag\n\n[ ] waterproof, both halves\n[ ] hat, gloves (even in July)\n[ ] map + compass (the phone is not a map)\n[ ] head torch, spare batteries\n[ ] 1.5 l water, flask of tea\n[ ] piece: cheese, oatcakes, tablet\n[ ] first aid kit, blister plasters\n[ ] midge net (May–Sept)\n[ ] bothy bag\n[ ] tell someone where\n' });
add({ id: 'rowan-jelly', ext: 'txt', title: 'Rowan jelly, as Nana wrote it', description: 'Copied out from the card in her tin, spelling and all.', truth: 'a generated plain-text recipe card for rowan jelly, written for the archive', bytes: 'ROWAN JELLY  (from June)\n\n3 lb rowan berries, stalks off\n2 lb crab apples or sharp cookers, chopped, cores in\n2 pints water\nsugar: 1 lb to every pint of juice\n\nSimmer berries and apples in the water till soft, 30 mins.\nHang in the jelly bag overnight. DO NOT SQUEEZE or it goes cloudy.\nMeasure juice, warm, add sugar, stir till gone, then boil hard.\nSet point after 10 mins or so — cold saucer, wrinkle test.\nPot hot. Good with lamb, better with cheese.\n' });
add({ id: 'letter-1953', ext: 'txt', title: 'A letter of 1953, typed out', truth: 'a generated plain-text transcription of a fictional 1950s letter between fictional people', bytes: 'Typed out from the tin, 2021. Letter 7 of 41.\n\nAt sea, 14th March 1953\n\nDear June,\n\nWe are two days out of Bergen and the sea has been kind for once. The cook made a pudding that could have ballasted the ship. I have your picture in the chart drawer where the mate cannot see it.\n\nLast night was clear and I found the star I told you about, low in the Whale. It is faint this month. It will come back bright, it always does. When we have a girl we could do worse than call her after it.\n\nTell your mother I have not forgotten the mangle.\n\nYours, with love and salt,\nArthur\n' });
add({ id: 'tideline-readme', ext: 'txt', title: 'tideline README', truth: 'a generated plain-text README of a fictional tide-prediction library', bytes: 'tideline\n========\n\nTide tables from harmonic constituents.\n\n    from tideline import Station\n    whitby = Station.load("whitby.json")\n    for event in whitby.extremes("2018-04-01", days=30):\n        print(event)\n\nThe constituents come from your harbour authority. tideline only does the\nsums: sum of cosines, nodal corrections, and finding the turning points.\n\nNOT FOR NAVIGATION. Use official tables at sea.\n\nLicence: MIT. Archived in 2023, with thanks to everyone who sent a fix.\n' });
add({ id: 'kayak-cut-list', ext: 'txt', title: 'Kayak cut list', truth: 'a generated plain-text cut list for a plywood kayak', bytes: 'KAYAK — cut list (okoume 4 mm unless noted)\n\nbottom panels      2 × 5.20 m (scarfed from 2.5 m sheets)\nside panels        2 × 5.18 m\ndeck, fore         2 × 2.30 m\ndeck, aft          2 × 2.10 m\nbulkheads (6 mm)   2\ncoaming            3 rings, laminated\nsheer clamps       pine 18 × 18, 2 × 5.3 m\n\nwire: copper 1 mm, about 300 stitches\nepoxy: 6 kg kit + extra hardener\nglass: 200 g/m² cloth, 8 m\n' });
add({ id: 'norwegian-words', ext: 'txt', title: 'Words, first year', truth: 'a generated plain-text list of Norwegian words with English glosses', bytes: 'kos — cosiness, but also a verb, and an attitude\nutepils — the first beer outside in spring\ndugnad — everyone turns up to clean the stairwell\npålegg — anything that goes on bread\nmatpakke — the packed lunch, a whole culture\nfjellvett — mountain sense; the nine rules\nhyttetur — a trip to the cabin\nregnvær — rain weather (so: most weather)\nskillingsbolle — the Bergen cinnamon bun\ntakk for sist — thanks for last time (said every time)\nuff — the sound of everything going slightly wrong\n' });
add({ id: 'atlas-errata', ext: 'txt', title: 'Atlas corrections', truth: 'a generated plain-text list of corrections to a fictional walking atlas', bytes: 'THIRTY WALKS — corrections after proofs\n\np. 14  walk 3: the gate is green now, not red\np. 22  walk 5: 6.4 km, not 4.6 km\np. 31  walk 8: the church is 1870s, check date\np. 40  the scale bar on map 11 is upside down (!)\np. 57  "Lofthus" spelled with two f\'s, fix\np. 63  walk 22: parking moved below the bridge\n' });

// Archives.
add({
  id: 'tideline-1-0',
  ext: 'zip',
  title: 'tideline 1.0 source',
  description: 'The source of the 1.0 release, as it was tagged.',
  truth: 'a generated zip of a small fictional Python library, a few short text files',
  bytes: zip({
    'tideline-1.0/README.txt': 'tideline 1.0 — tide tables from harmonic constituents. NOT FOR NAVIGATION.\n',
    'tideline-1.0/LICENSE': 'MIT License\n\nCopyright (c) 2018 Mira Testwell\n',
    'tideline-1.0/tideline/__init__.py': 'from .station import Station\n\n__version__ = "1.0"\n',
    'tideline-1.0/tideline/station.py': 'import json, math\n\n\nclass Station:\n    def __init__(self, name, datum, constituents):\n        self.name, self.datum, self.constituents = name, datum, constituents\n\n    @classmethod\n    def load(cls, path):\n        with open(path) as f:\n            data = json.load(f)\n        return cls(data["name"], data["datum"], data["constituents"])\n\n    def height(self, hours):\n        return self.datum + sum(\n            c["amplitude"] * math.cos(math.radians(c["speed"] * hours - c["phase"]))\n            for c in self.constituents\n        )\n',
  }, new Date(Date.UTC(2018, 3, 2))),
});
add({
  id: 'munro-map-source',
  ext: 'zip',
  title: 'Munro map source',
  truth: 'a generated zip of a tiny fictional web map: an HTML page and a GeoJSON file',
  bytes: zip({
    'munro-map/index.html': '<!doctype html>\n<title>Munros</title>\n<div id="map"></div>\n<script src="map.js"></script>\n',
    'munro-map/map.js': '// colours the hills I have climbed\nfetch("munros.geojson").then((r) => r.json()).then(draw);\n',
    'munro-map/munros.geojson': '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Ben Lomond","climbed":"2017-05-06"},"geometry":{"type":"Point","coordinates":[-4.6331,56.1903]}}]}\n',
  }, new Date(Date.UTC(2019, 0, 20))),
});
add({
  id: 'atlas-drafts',
  ext: 'zip',
  title: 'Atlas drafts',
  truth: 'a generated zip of two simple SVG sketches and a text note',
  bytes: zip({
    'drafts/walk-01.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><path d="M10 120 C60 90 90 100 120 60 S180 20 190 10" fill="none" stroke="#a33" stroke-width="2" stroke-dasharray="4 3"/><text x="12" y="134" font-size="9">Utne shore</text></svg>\n',
    'drafts/walk-02.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><circle cx="100" cy="70" r="50" fill="none" stroke="#567"/><circle cx="100" cy="70" r="30" fill="none" stroke="#567"/><text x="12" y="134" font-size="9">Above the orchards</text></svg>\n',
    'drafts/notes.txt': 'contours every 20 m on the drafts, 10 m in the book\nlettering: italic for water, caps for farms\n',
  }, new Date(Date.UTC(2026, 1, 1))),
});
add({
  id: 'plotter-contours',
  ext: 'zip',
  title: 'Contours as G-code',
  truth: 'a generated zip of a short fictional G-code file for a pen plotter',
  bytes: zip({
    'contours/arthurs-seat.gcode': `; contours, 10 m\nG21\nG90\n${Array.from({ length: 40 }, (_, i) => `G1 X${round(50 + 30 * Math.cos(i / 6), 2)} Y${round(50 + 20 * Math.sin(i / 6), 2)} F2100`).join('\n')}\nM5\n`,
    'contours/README.txt': 'pen down = M3, pen up = M5. Paper A3, origin bottom left.\n',
  }, new Date(Date.UTC(2021, 3, 10))),
});
add({
  id: 'recording-notes',
  ext: 'zip',
  title: 'Recording notes',
  truth: 'a generated zip of fictional field-recording notes',
  bytes: zip({
    'notes/sessions.csv': 'day,place,minutes,wind\n2022-10-08,Sandviken roof,22,calm\n2023-01-14,Bryggen,9,light\n2023-04-22,Vågen,31,fresh\n',
    'notes/kit.txt': 'recorder, two small omnis, dead cat windshield (the fluffy one), spare AA\n',
  }, new Date(Date.UTC(2023, 5, 1))),
});

// ----------------------------------------------------------------- writing
mkdirSync(MEDIA, { recursive: true });
mkdirSync(FILES, { recursive: true });
for (const file of made) {
  writeFileSync(join(MEDIA, `${file.id}.${file.ext}`), file.bytes);
  writeFileSync(
    join(FILES, `${file.id}.yaml`),
    fileYaml({
      kind: kindOf(file.ext),
      ext: file.ext,
      title: file.title,
      description: file.description,
      origin: 'generated',
      licence: 'CC0-1.0',
      licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      transform: 'made by scripts/media/gen.ts',
      people: 'none',
      truth: file.truth,
    }),
  );
}
console.log(`${made.length} generated files`);
