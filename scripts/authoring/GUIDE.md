# Writing the archive: a guide for authors

You are writing part of a fictional life archive: Mira Testwell's ten years,
2016-10-01 → 2026-10-15. Read these first, in full:

1. `FORMAT.md` — the format. Every file you write must keep to it.
2. `BIBLE.md` — the life: people, places, timeline, projects with sections,
   events, pages, tags, voice. **Ids come from the bible; never invent an id
   of a project, section, event, page or tag.**
3. The conformance archive in Thei, a working example of every construct:
   `E:/code/thei/tests/lab/archive/conformance/archive/` (its words are
   placeholders; ours are a real-feeling life).
4. `drafts/catalogue.md` — every media file you may place, by id, with what
   it shows, under one `##` heading per subject. It is long: list its
   headings (`grep -n "^## " drafts/catalogue.md`) and read the subjects you
   need, or Grep it for a word. **Never invent a file id.**
5. Your assignment (in the message that started you).

## How to write files: bundles

Write your files as one or more **bundles** under `drafts/out/<your name>/`,
about 30–40 files per bundle (`01.md`, `02.md`, …). A bundle is many files in
one: a line `=====> <path>` starts a file, and everything up to the next such
line is its content:

```
=====> diary/2017/2017-03-07.md
---
relations:
  - to: event:first-bindery-evening
    kind: related
---

First evening at the bindery. …
=====> diary/2017/2017-03-08.md
Short one today. …
```

Then split and lint it:

```
bun scripts/authoring/split.ts drafts/out/<your name>/01.md
```

It writes the files into the archive and prints every problem (it reads your
texts with Thei's own Lab Markdown scanner). Fix the bundle and split again
until it says `0 with problems`. A ref to an id of the bible that nobody has
written yet is fine; the lint knows the bible's ids. Do not edit files outside
your assignment, and do not edit FORMAT.md, BIBLE.md or the scripts.

## Rules of the texts

- **English, British spelling** (colour, metres, organise, Mum). Mira's
  voice follows the bible's section 4 for the year you write.
- **Frontmatter is YAML.** Quote strings that contain `: `, `#`, or start
  with a quote, `*`, `&`, `!`, `[`, `{`, `>` or `|`. Days are `YYYY-MM-DD`.
  A month-precise period still writes days: `start: 2021-04-01`, `end:
  2021-06-30`, `precision: month`. A `doubt` needs a precision other than
  exact. A period label is at most 100 characters.
- **Lab Markdown only** (FORMAT.md): paragraphs, `##`/`###`, quotes, lists,
  `---`, the directives. No tables, no code, no `#` or `####`, no images
  `![]()`, no HTML but `<b>`, `<i>`, `<s>`.
- **A colon directly followed by a letter or digit is read as a directive**
  and fails: `10:30`, `ratio 2:1`, `note:this`. Write times as `10.30` or
  `half ten`, or escape the colon: `10\:30`. A colon followed by a space is
  fine. Inside YAML frontmatter (titles, captions) colons are free.
- **Refs:** `[words](ref:project:kayak)`, `[words](ref:section:kayak/launch)`,
  `[words](ref:event:kayak-launch)`, `[words](ref:diary:2023-05-20)`,
  `[words](ref:page:about)`, `[words](ref:tag:boatbuilding)`. A link to a
  heading: `[words](<ref:project:farmhouse#h:Fourteen windows> "note")` — the
  heading must exist in that entity's body, word for word (the bible names a
  few such headings; when you link to one you write yourself, make sure it is
  there). A passage: `[words](ref:event:fair#:~:text=lamp)`.
- **Files:** `::media` takes a picture or a video, `::audio` a recording,
  `::file` anything. A gallery holds `::media` lines only, at least three. A
  `:::files` group holds `::file` and `::audio` lines. Icons are pictures;
  banners, showcase items pictures or videos; a status's `file` a picture.
- **Containers that nest** take more colons on the outside: `::::private`
  around a `:::gallery`. A private part never nests in another.
- **Embeds** are YouTube only. Use only these (Blender's open films, real):
  `https://www.youtube.com/watch?v=aqz-KE-bpKQ` (Big Buck Bunny),
  `eRsGyueVLvQ` (Sintel), `R6MlUcmOul8` (Tears of Steel), `WhWc3b3KhnY`
  (Spring), `Y-rmzh0PI3c` (Cosmos Laundromat), `TLkA0RELQ1g` (Elephants
  Dream), `mN0zPOpADL4` (Agent 327), `UXqq0ZvbOnk` (Charge), `_cMxraX_5RE`
  (Sprite Fright), `PVGeM40dABA` (Coffee Run), `SkVqJ1SGeL0` (Caminandes 3).
  In the story they are films Mira watched (a film night with the orchestra,
  a rainy Sunday, a talk that showed one).
- **External links** use `https://example.org/…` or `https://example.com/…`
  for anything of Mira's world (her shop, the orchestra's site, a club), and
  real public sites only for real public things (`https://en.wikipedia.org/…`,
  `https://www.met.no`, `https://commons.wikimedia.org`). Never a real
  person's page.
- **No real people.** Only the bible's people, and nameless strangers.

## Headings you can link to

These headings are promised: their writers put them in, word for word, as
`##` or `###` in the body. Anyone may link to them with `#h:`:

| Entity | Headings |
| --- | --- |
| `section:tideline/harmonics` | Constituents · The equilibrium tide |
| `section:farmhouse/the-house` | Fourteen windows · The barn |
| `project:kayak` | Plans · The launch |
| `project:camino` | Stages |
| `project:biscuit` | Things he eats |
| `project:cello` | Why the cello |
| `page:how-tides-work` | The moon · Harmonics |
| `page:about` | How to read this site |
| `page:norwegian-words` | Food · Weather |

`[the windows](<ref:section:farmhouse/the-house#h:Fourteen windows> "all of them")`

## Who declares a relation

A pair is related once, on one side only:

- a **diary entry** declares its relations to projects and events (and,
  rarely, to an earlier diary entry);
- an **event** declares its relation to its project (the bible's `→`) and,
  rarely, to an earlier event; **never** to a diary entry;
- a **project** declares relations to other projects only, and only when its
  id sorts first of the two (`cello` → `field-recordings`, never back).

Kinds: `related` mostly; `depends-on` (this needed that), `affects` (this
changed that). About one relation in seven has a shared `note`, about one in
twenty a note per side (`notes: { this: …, other: … }`).

## What every text may carry

`notes` (the owner's own notes, Lab Markdown in a block scalar) and
`reminder` (one plain line) on some entities — perhaps one in ten. Access:
most things public; the bible marks link-only and private ones. In the
diary, about one entry in twenty is private and one in fifty link-only, more
in hard months (Nov–Dec 2020, Oct 2023 – Jan 2024); a `:::private` part
inside a public text now and then.

## Constructs everybody uses

The archive must use every block and inline construct many times. Use them
where they belong in the story, not as a sampler. In your assignment you get
your own minimums; as a reminder, the constructs are: paragraph, `##`, `###`,
`> quote`, `:::quote[caption]{align="center"}`, `-` lists, `1.` lists, a list
starting at another number (`3.`), `- [ ]`/`- [x]` checklists, nested lists,
`:::list{counter="lower-roman"}`, `---`, `::media` (layouts `centered`,
`natural`, `stretch`), `:::gallery`, `::audio`, `::file`, `:::files`,
`::link[note]{url="…"}`, `::card[note]{to="ref:…#fragment"}`, `::embed`,
`:::private`, `:::spoiler`, `**bold**`, `*italic*`, `~~strike~~`, a line
break (backslash at the end of a line), `:hint[words]{note="…"}`, external
links with and without a note, relative links (`[the diary](/diary/)`,
`[all projects](/projects/)`, `[tags](/tags/)`), entity links with a
fragment, with a heading, with a note.

## Planted things

`plants.yaml` records what was planted on purpose. If your assignment gives
you a plant, write it exactly where it says, and at the end of your last
bundle's run list each of yours (path, where, the word) in your final
message.

**Reserved words** — never write these anywhere unless your assignment plants
that very word: quillwort, spindrift, verdigris, foxing, lanolin, gloaming,
Cetus, almanac, barnacle, guillemot (singular; "guillemots" is free), whittle
/ whittled / whittling, caulk / caulked / caulking, overdraft, payslip,
listlessness, snowglobe, bunting, kelpie, marram, tidewrack, naive / naïve,
fo'c'sle, and the misspellings definately, recieve, accomodation, teh, wierd,
seperate.

## When you are done

Your final message: the paths you wrote (counts are enough), your plants,
anything in the bible you had to settle (a date, a name), and anything that
did not fit.
