# The Thei lab archive format, v1

This repository holds one fictional life, written down the way a person keeps
it in [Thei](https://github.com/Gwynerva/thei): projects, events, a diary,
pages, tags, the relations between them and the files they show. Thei's lab
reads it, seeds it into a test site through Thei's own admin routes, and plays
scenarios over it.

The format belongs to the archive, not to Thei. It names things the way a
person thinks of them — a project, a section, a day — and never the way Thei
stores them: no uuids, no table names, no storage shapes. When Thei changes,
the adapter in Thei's repository (`tests/lab/archive/`) changes with it, and
the archive stays as it is. A change of the format itself is versioned (see
"Versions").

**Keep it true.** A change to what the format accepts belongs in this file in
the same commit.

## Layout

```
archive.yaml                          the archive as a whole
BIBLE.md                              the life: people, places, timeline (for authors; never parsed)
person.md                             the owner's profile
tags/<id>.md
pages/<id>.md
projects/<id>/project.md
projects/<id>/sections/<NN>-<id>.md
events/<YYYY>/<id>.md                 YYYY: the year its first period starts
diary/<YYYY>/<YYYY-MM-DD>.md
diary/relative/today+<N>.md           days counted from the day of seeding
files/<id>.yaml                       what one media file is, and where it came from
plants.yaml                           properties planted on purpose
media/                                working copies of the files; not in git, published as packs
```

Every text file is UTF-8 with LF line endings. Entity files are YAML
frontmatter between `---` lines, then a body in Lab Markdown (below). A file
whose kind has no body field leaves the body empty.

## General rules

- **Ids** are `[a-z0-9]+(-[a-z0-9]+)*`, unique within their kind, at most 48
  characters. A section's id is unique within its project. An id is never
  renamed or reused once a release carries it; removing an entity is a major
  version.
- **Unknown keys are errors**, except keys starting with `x-`, which every
  reader ignores (authoring notes).
- **Booleans default to `false`**, lists to empty, optional strings to empty.
- **Access** is `public`, `link-only` or `private`, default `public`.
- **Dates** are `YYYY-MM-DD`, or relative: `today`, `today+N`, `today-N`
  (see "Relative days").
- **Refs** name an entity:

  | Ref                            | Names                                   |
  | ------------------------------ | --------------------------------------- |
  | `project:<id>`                 | a project                               |
  | `section:<project>/<id>`       | a section of a project                  |
  | `event:<id>`                   | an event                                |
  | `diary:YYYY-MM-DD`             | the diary entry of that day             |
  | `diary:today+N`                | a diary entry under `diary/relative/`   |
  | `page:<id>`                    | a page                                  |
  | `tag:<id>`                     | a tag                                   |

- **Files** are named by their id alone in a frontmatter field that only
  takes files (`icon: kettle-sketch`). A field that takes either a keyword or
  a file writes the file as `file:<id>`.
- **Words are stored as typed.** Thei settles the last mark of captions and
  headings and formats words on the way out; the archive does neither.

## `archive.yaml`

```yaml
format: 1            # the format's major version
revision: 0          # the constructs this archive may use (see "Versions")
version: 1.0.0       # this archive's release
title: …             # what the life is, in a few words
language: ru         # the site language the texts are written for
span:
  start: 2016-10-01  # the first day the archive writes about
  end: 2026-10-15    # the last absolute day it writes about
```

## Kinds

Fields marked **required** must be present and non-empty. A body is Lab
Markdown unless said otherwise. `notes` is the owner's own notes, never
shown publicly: Lab Markdown in a YAML block scalar. `reminder` is one plain
line of at most 500 characters.

### `person.md` — the profile

| Field       | Type                                         | Notes                                                   |
| ----------- | -------------------------------------------- | ------------------------------------------------------- |
| `name`      | string, **required**                         | the name shown on the site                              |
| `nickname`  | string                                       |                                                         |
| `birthDate` | date                                         |                                                         |
| `slogan`    | string                                       |                                                         |
| `avatars`   | file ids, oldest first                       | the last is the current avatar; the rest are its history |
| `banner`    | file id                                      |                                                         |
| `favicon`   | file id                                      |                                                         |
| `facts`     | list of `{ name, value }`                    | short facts, in order                                   |
| `links`     | list of `{ url, name, note?, private? }`     | the profile's chips                                     |
| `pinned`    | list of `page:<id>`                          | pages pinned to the profile                             |
| `statuses`  | list of statuses                             | see "Statuses"                                          |

Body: the "about me" text.

### `tags/<id>.md`

| Field      | Type                 |
| ---------- | -------------------- |
| `title`    | string, **required** |
| `slug`     | string               |
| `synonyms` | strings              |
| `icon`     | file id              |

Body: the tag's description, plain text (no markup).

### `pages/<id>.md`

| Field      | Type                 | Notes                     |
| ---------- | -------------------- | ------------------------- |
| `title`    | string, **required** |                           |
| `summary`  | string, **required** |                           |
| `slug`     | string               | defaults to the id        |
| `access`   | access               |                           |
| `icon`     | file id              |                           |
| `synonyms` | strings              | other names it is found by |
| `reminder` | string               |                           |
| `notes`    | Lab Markdown         |                           |

Body, **required**: the page.

### `projects/<id>/project.md`

| Field       | Type                                        | Notes                                                        |
| ----------- | ------------------------------------------- | ------------------------------------------------------------ |
| `title`     | string, **required**                        |                                                              |
| `summary`   | string, **required**                        |                                                              |
| `slug`      | string                                      | derived from the title when absent                           |
| `access`    | access                                      |                                                              |
| `featured`  | boolean                                     | among the chosen projects of the home page                   |
| `cv`        | boolean                                     | in the résumé                                                |
| `icon`      | file id                                     | a picture                                                    |
| `banner`    | file id                                     | a picture or a video                                         |
| `tags`      | tag ids                                     |                                                              |
| `synonyms`  | strings                                     |                                                              |
| `reminder`  | string                                      |                                                              |
| `notes`     | Lab Markdown                                |                                                              |
| `links`     | list of `{ url, note?, private? }`          |                                                              |
| `files`     | list of `{ file, title?, caption?, private? }` | `title` defaults to the file's own title                   |
| `showcase`  | list of `{ file, caption?, private? }`      | pictures and videos                                          |
| `statuses`  | list of statuses                            | see "Statuses"                                               |
| `action`    | action                                      | see "Action button"                                          |
| `relations` | list of relations                           | see "Relations"                                              |

Body: the project's description. Its sections are the files of its
`sections/` folder.

### `projects/<id>/sections/<NN>-<id>.md`

`NN` is a two- or three-digit number: the owner's order of the project's
sections. Thei reads general sections (without periods) in that order and
dated ones (stages) in the order of their periods.

| Field     | Type            | Notes                                        |
| --------- | --------------- | -------------------------------------------- |
| `title`   | string, **required** |                                         |
| `summary` | string          |                                              |
| `slug`    | string          |                                              |
| `private` | boolean         | a private section of a project                |
| `periods` | list of periods | a section with periods is a stage            |
| `banner`  | file id         |                                              |

Body: the section's text. A section needs a body, periods, or both. A
section has no relations and no tags of its own.

### `events/<YYYY>/<id>.md`

| Field       | Type                         | Notes                         |
| ----------- | ---------------------------- | ----------------------------- |
| `title`     | string, **required**         |                               |
| `summary`   | string, **required**         |                               |
| `slug`      | string                       |                               |
| `access`    | access                       |                               |
| `periods`   | list of periods, **required** | at least one                 |
| `banner`    | file id                      |                               |
| `tags`      | tag ids                      |                               |
| `synonyms`  | strings                      |                               |
| `reminder`  | string                       |                               |
| `notes`     | Lab Markdown                 |                               |
| `links`     | as a project's               |                               |
| `files`     | as a project's               |                               |
| `action`    | action                       |                               |
| `relations` | list of relations            |                               |

Body, **required**: the event.

### `diary/<YYYY>/<YYYY-MM-DD>.md` and `diary/relative/today+<N>.md`

One entry a day; the file name is its day. The frontmatter is optional:

| Field       | Type              |
| ----------- | ----------------- |
| `access`    | access            |
| `reminder`  | string            |
| `notes`     | Lab Markdown      |
| `relations` | list of relations |

Body, **required**: the entry. A diary entry never has a title, a summary or
tags; any of them is an error.

## Shared shapes

### Periods

```yaml
periods:
  - 2019-05-04                       # one day
  - 2019-05-04..2019-06-01           # a stretch
  - start: 2019-09-01
    end: today+90                    # still running: its end has not come
    precision: month                 # exact (default) | day | month | year
    doubt: "начала не помню точно"   # what is unsure; only when precision is not exact
    label: "Учёба"                   # names the stretch; a heading, at most 100 characters
```

`end` defaults to `start`. A start after its end is an error.

### Statuses

```yaml
statuses:
  - date: 2021-03-02
    text: "Ищу дерево для рамы"
    file: workbench-photo            # a picture beside the status; optional
  - date: 2021-04-10
    empty: true                      # "nothing to say": a status with no words
```

A status is identified by its day and its place among the statuses of that
day. An empty status has no text and no file, and never directly follows
another empty status.

### Relations

Declared on a project, an event or a diary entry, once per pair — on either
end, never on both:

```yaml
relations:
  - to: event:first-fair
    kind: related                    # related | depends-on | affects, read from this side
    note: "там впервые показала лампу"
  - to: diary:2020-02-14
    kind: affects
    notes:
      this: "что эта сторона говорит"
      other: "что говорит другая"
```

A relation joins two of projects, events and diary entries. A relation to a
section, a page or a tag is an error, never dropped quietly. A mention in a
text is a link, not a relation.

### Action button

```yaml
action:
  text: "Скачать"                    # required, at most 30 characters
  link: https://…                    # either link …
  file: assembly-guide               # … or file
  color: "#3a7bd5"                   # accent colour
  private: false
  icon: favicon                      # absent: the default icon; `favicon`; or `file:<id>`
  background: auto                   # standard (default) | auto | accent | file:<id>
  size: cover                        # natural (default) | contain | cover | stretch
  repeat: no-repeat                  # no-repeat (default) | repeat-x | repeat-y | repeat
```

## Lab Markdown

CommonMark with GFM strikethrough and task list items, and generic
directives (the `micromark-extension-directive` syntax). Nothing else: no
tables, no code blocks, no raw HTML but `<b>`, `<i>` and `<s>`, no `![]()`
images, no footnotes, no headings other than `##` and `###`. A bare address
stays text.

### Blocks

| What                          | Lab Markdown                                                        |
| ----------------------------- | ------------------------------------------------------------------- |
| paragraph                     | a paragraph; a line break is a backslash at the end of a line       |
| heading                       | `## words` / `### words` — plain words                              |
| quote                         | `> words`                                                           |
| quote with a caption, centred | `:::quote[caption]{align="center"}` … `:::`                         |
| list                          | `-`, `1.` (its first number kept), `- [ ]` / `- [x]`; nested by indent |
| list with another counter     | the list inside `:::list{counter="lower-roman"}` … `:::`; counters: `numeric`, `lower-roman`, `upper-roman`, `lower-alpha`, `upper-alpha` |
| delimiter                     | `---`                                                               |
| a picture or a video          | `::media[caption]{file="<id>" layout="centered"}`; layouts: `centered` (default), `natural`, `stretch` |
| a gallery                     | `:::gallery{title="…"}` with one `::media[caption]{file="<id>"}` line per item, `:::` |
| a recording, played in place  | `::audio[caption]{file="<id>" title="…"}`                           |
| a file, shown as a download   | `::file[caption]{file="<id>" title="…"}`                            |
| files listed together         | `:::files{title="…"}` with one `::file` or `::audio` line per file, `:::` |
| a link card                   | `::link[note]{url="https://…"}`                                     |
| a card of an entity           | `::card[note]{to="ref:<kind>:<id>#fragment"}`                       |
| a video of another site       | `::embed{url="https://www.youtube.com/watch?v=…"}` — YouTube only   |
| a private part                | `:::private` … `:::` around its blocks                              |
| a spoiler                     | `:::spoiler` … `:::` around one or more blocks                      |

A `title` is plain words; a caption and a note take the inline markup below.
Where containers nest, the outer one takes more colons
(`::::private` around a `:::gallery`). A private part never nests in another.
Items of a gallery or a group carry no ids: the adapter gives them.

### Inline

| What               | Lab Markdown                                      |
| ------------------ | ------------------------------------------------- |
| bold               | `**words**`                                       |
| italic             | `*words*`                                         |
| strikethrough      | `~~words~~`                                       |
| external link      | `[words](https://… "note")` — the note is optional |
| relative link      | `[words](/path)`                                  |
| link to an entity  | `[words](ref:<kind>:<id>#fragment "note")`        |
| hint               | `:hint[words]{note="…"}`                          |

`<b>`, `<i>` and `<s>` may stand for the marks where stars or tildes would
run together. In an entity ref `<kind>` is `project`, `section`, `event`,
`diary`, `page` or `tag`, and `<id>` is what follows the colon in a ref:
`ref:section:moon-lamp/idea`, `ref:diary:2019-03-04`.

A fragment is optional and kept as written: `#:~:text=…` points at a passage.
`#h:<heading words>` names a heading of the target by its words; the adapter
turns it into the anchor Thei gives that heading.

## Relative days

Some things only make sense relative to the day a site is made: a diary
entry still to come, a stretch still running. A date may be written
`today`, `today+N` or `today-N` in a period's `start` or `end`, a status's
`date`, and the name of a file under `diary/relative/`.

They are resolved when the archive is seeded, against the seeding machine's
local day, and the result is recorded with the site. A resolved diary day
must lie after `span.end` and must not fall on an absolute day of the diary.

Every archive has at least: entries on `today+1` and `today+2` (the first may
already have come somewhere on Earth, the second has not come anywhere), and
one project section and one event whose period ends on a day still to come.

## Files

### `files/<id>.yaml`

| Field         | Type                                  | Notes                                                      |
| ------------- | ------------------------------------- | ---------------------------------------------------------- |
| `kind`        | `image` `video` `audio` `document` `other` | what it is; must agree with the extension              |
| `ext`         | string, **required**                  | the extension of the published file                        |
| `title`       | string, **required**                  | plain words; a file list's default title                   |
| `description` | string                                | what the file is, as the owner would describe it (Thei's file description); at most 1 000 characters |
| `origin`      | `commons` `generated` `original`      |                                                            |
| `source`      | `{ page, download, retrieved }`       | for `commons`: the file page, the address downloaded, the day |
| `author`      | string, **required** unless generated |                                                            |
| `licence`     | SPDX-like id, **required**            | `CC-BY-SA-4.0`, `CC-BY-4.0`, `CC0-1.0`, `PD`, …           |
| `licenceUrl`  | string                                |                                                            |
| `attribution` | string                                | the line `ATTRIBUTION.md` prints                            |
| `transform`   | string                                | what was done to the original: "long side 1920, JPEG q85"  |
| `people`      | `none` `incidental`                   | no file shows an identifiable person as its subject        |
| `truth`       | string                                | what the file really shows, in English, for whoever plays a model in a test |

A file is placed by its id wherever the frontmatter or a text names it. One
file may stand in many places.

## `plants.yaml`

What was planted on purpose, so that a test can find "an untagged event" or
"a text with typos" without knowing its id:

```yaml
- id: typo-autumn-fair
  ref: event:autumn-fair             # or file: <id>
  traits: [typos]
  where: body                        # body | notes | caption | hint | status | period-label | fact | description | link-note | relation-note | title
  word: "пррект"                     # the planted word, when there is one
  detail: "«пррект» → «проект»"
```

Traits are an open vocabulary. Common ones: `typos`, `unique-word`,
`long-summary`, `untagged`, `no-description`, `only-file`,
`mention-without-relation`, `private-part`, `long-text`, `long-word`,
`signs-in-title`, `emoji`, `link-only`, `many-relations`, `future-day`,
`broken-link`, `near-duplicate-tag`.

Only what a reader cannot compute is planted. Word counts, files, relations,
banners, private parts, access, periods and whether a period still runs are
computed from the archive itself.

## What an archive covers

A release is checked against these, so that every screen of Thei has
something to show:

- every block and every inline construct above, each at least five times,
  including an entity link with a fragment and with a note, and a hint;
- every access level of every kind that has one;
- every precision of a period, labelled and unlabelled periods, a period
  with a doubt, a period still running;
- general, dated and private sections;
- statuses with and without a picture, and an empty one;
- relations of every kind, with a shared note and with one per side;
- files with the extensions jpg, png, gif, webp, avif, svg, mp4, webm, mov,
  mp3, ogg, wav, flac, m4a, pdf, txt, csv, json and zip;
- words hidden until a reader acts: under a spoiler, on the third slide of a
  gallery, in the second file of a group;
- files placed in more than one place.

## Releases

A release is a tag `vX.Y.Z` with these assets:

- `text.tar` — every file of the repository but `media/`;
- `media-NN.tar` — the files, uncompressed, each pack at most about 300 MB,
  as `media/<id>.<ext>`, with `ATTRIBUTION.md`;
- `release.json`:

```json
{
  "format": 1,
  "revision": 0,
  "version": "1.0.0",
  "commit": "<sha of the tagged commit>",
  "text": { "asset": "text.tar", "sha256": "…", "bytes": 0 },
  "packs": [{ "asset": "media-01.tar", "sha256": "…", "bytes": 0, "files": 0 }],
  "files": {
    "<id>": {
      "pack": "media-01.tar",
      "path": "media/<id>.jpg",
      "sha256": "…",
      "bytes": 0,
      "mime": "image/jpeg",
      "width": 1920,
      "height": 1280,
      "durationSec": null,
      "pages": null
    }
  }
}
```

## Versions

- **MAJOR** — a breaking change of the format, or an id renamed or removed.
- **MINOR** — content added.
- **PATCH** — words corrected.

`revision` grows when the format gains an optional construct (a new block,
a new field). A reader declares the highest revision it reads, and refuses a
newer archive by saying so; it never drops what it does not know.

## Validation

A reader refuses an archive, listing every reason, when:

- a ref, a tag id or a file id names nothing;
- a file stands where its kind cannot: an icon, a banner, a showcase item, a
  status picture or a `::media` that is not a picture or a video (an icon a
  picture only), an `::audio` that is not a recording;
- a date is not a day, or a period starts after it ends;
- two diary entries share a day, or a relative day breaks the rules above;
- a diary entry has a title, a summary or tags; a section has relations;
- a required field is missing;
- an `::embed` is not a YouTube address;
- a private part nests in another;
- a pair of entities is related twice;
- an id breaks the id rule, or a key is unknown.

Thei's own limits — the length of a title, a summary, a caption — are
reported as warnings, never as rules of the format: they are Thei's to
change.
