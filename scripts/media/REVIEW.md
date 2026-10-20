# Reviewing media candidates

The archive (`BIBLE.md`) is Mira Testwell's fictional life, 2016–2026: a
cartographer from Whitby who lives in Edinburgh, then Bergen, then on a farm
in Hardanger; crafts, code, travel, music, a ginger cat called Biscuit. Its
pictures, videos, recordings and documents come from Wikimedia Commons, and
the story treats them as Mira's own.

You review one group of candidates and choose the files the archive keeps.

## What you get

- `media-work/sheets/<group>.md` — every slot of your group: how many files it
  wants, what for, and its numbered candidates with their Commons file name,
  size, licence, description and categories.
- `media-work/sheets/<group>-NN.jpg` — contact sheets: each tile is labelled
  `<slot> <number>`, the same numbers as in the list. Recordings have no
  tile. Open every sheet of your group with the Read tool and look.

## Choose

For each slot, choose the slot's number of files (`wants N`) among its
candidates, the best first. Leave a candidate out when:

- **an identifiable person is its subject** — a face you could recognise, a
  posed person, a portrait, a performer in close-up. People small and
  incidental in a landscape or a street, not recognisable, are fine (mark
  them `incidental`);
- **a logo, a brand mark or a trademark is its subject** (a product name in
  passing is fine);
- it does not show what the slot wants, is poor (blurry, tiny, a scan of
  nothing), is a near-duplicate of another you chose, or would be strange in
  a pleasant personal archive (gore, war, accidents);
- for a video: a person is the subject, or it is mostly titles or talking;
- for a recording: it is speech of an identifiable person (an interview, a
  lecture). Music, birds, weather, places are fine;
- for a document: it is not something a person would keep (a form, a page of
  nothing).

If fewer good candidates exist than the slot wants, choose fewer, and say so.

## Write, for each file you choose

- `title` — plain words, the way Mira names her own files: short, concrete,
  a little personal ("The abbey from the pond", "Rain on the skylight",
  "Ben Lomond from the north"). No file extensions, no Commons jargon. For a
  document, the name she'd give it ("A manual of tides, 1940").
- `description` — one or two sentences as Mira would describe it in her
  library (what, where, a little why). **Leave it out for about one file in
  eight.**
- `truth` — what the file really shows, plainly and accurately, from what you
  see and the Commons description (place, subject, season if visible). At
  most about 200 characters. No author names.
- `people` — `none`, or `incidental`.

Do not use any of these words anywhere: quillwort, spindrift, verdigris,
foxing, lanolin, gloaming, Cetus, almanac, barnacle, guillemot, whittle,
caulk, overdraft, payslip, listlessness, snowglobe, bunting, kelpie, marram,
tidewrack, naive, fo'c'sle.

## Answer

Write `media-work/review/<group>.yaml`, slot by slot, in the order of the
list:

```yaml
whitby-abbey:
  - k: 1
    title: The abbey from the pond
    description: Whitby Abbey on a still afternoon, the pond in front of it like a mirror.
    truth: The ruins of Whitby Abbey reflected in the pond in front of it, daylight, grass in front.
    people: none
  - k: 4
    title: …
    truth: …
    people: incidental
saltwick-bay: []          # nothing usable
```

`k` is the candidate's number. Then check the file parses (`bun -e "require('yaml').parse(require('fs').readFileSync('media-work/review/<group>.yaml','utf8'))"`)
and end with a short report: per slot with fewer than wanted, how many; and
anything doubtful.
