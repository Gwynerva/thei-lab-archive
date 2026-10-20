# Thei lab archive

A fictional life of ten years, written down the way a person keeps it in
[Thei](https://github.com/Gwynerva/thei): projects, events, a diary, pages,
tags, relations, and about a thousand files they show. Thei's lab seeds it
into a test site and plays scenarios over it, so that a change of Thei is
tried on a large, varied archive instead of a handful of samples.

Nothing here is about a real person. The pictures, videos, recordings and
documents are free files from Wikimedia Commons, each with its author and
licence (`files/<id>.yaml`, and `ATTRIBUTION.md` in every media pack), or
files made for the archive.

- [`FORMAT.md`](FORMAT.md) — the format: what each file holds and how texts
  are written. It belongs to the archive, not to Thei.
- [`BIBLE.md`](BIBLE.md) — the life itself: people, places, the timeline. For authors.
- Releases — `text.tar`, the media packs and `release.json`, which Thei's
  `tests/lab/archive.lock.json` pins.

## The life

Mira Testwell, a cartographer from Whitby, from 2016-10-01 to 2026-10-15:
a master's in Edinburgh, flood maps in Leith, the cello again, a ginger cat
called Biscuit, lockdown, Nana June's letters, a move to Bergen, a kayak
built in a boathouse, burnout and a slow turn, the Camino, an old farmhouse
above the Hardangerfjord with forty apple trees, a walking atlas, a wedding
in the orchard.

| | |
| --- | --- |
| Projects | 71, with 319 sections |
| Events | 252 |
| Diary | 2,000 days, and two relative days still to come |
| Pages | 36 |
| Tags | 130 |
| Relations | about 1,750 |
| Files | 1,014 (980 from Wikimedia Commons, 34 made here), ≈ 1.3 GB |
| Plants | 70 (`plants.yaml`) |

## Working on it

- `bun install` — the tools' dependencies (sharp, yaml).
- `scripts/media/` — how the media were found and made: `slots.yaml` (what to
  look for), `search.ts`, `review.ts` (contact sheets for reviewers), `pick.ts`,
  `build.ts` (download, size, convert), `describe.ts` (writes `files/<id>.yaml`),
  `gen.ts` (the archive's own csv, json, txt and zip files). `media/` and
  `media-work/` are never committed.
- `scripts/authoring/` — the writers' guide, the diary plan, a lint
  (`split.ts`, `lint-files.ts`, reading texts with Thei's own scanner) and
  `check-plants.ts`.
- `scripts/release.ts` — builds `dist/` (`text.tar`, `media-NN.tar`,
  `release.json`); `--publish` makes the GitHub release.
- From a checkout of Thei: `THEI_LAB_ARCHIVE=<this folder> bun run lab check --media`
  validates the archive and its coverage.

## Licences

- Texts, metadata and generated files: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- Tools: MIT.
- Media from Wikimedia Commons: each under its own licence, named in its
  `files/<id>.yaml` and in `ATTRIBUTION.md`.
