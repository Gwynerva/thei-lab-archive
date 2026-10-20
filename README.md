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
- `BIBLE.md` — the life itself: people, places, the timeline. For authors.
- Releases — `text.tar`, the media packs and `release.json`, which Thei's
  `tests/lab/archive.lock.json` pins.

## Status

Format v1 is drafted; the life is being written.

## Licences

- Texts, metadata and generated files: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- Tools: MIT.
- Media from Wikimedia Commons: each under its own licence, named in its
  `files/<id>.yaml` and in `ATTRIBUTION.md`.
