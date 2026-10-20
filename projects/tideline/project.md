---
title: "tideline: tide tables from harmonics"
summary: A small Python library that predicts tides from harmonic constituents. 1.0 in 2018, a handful of users on three continents, archived in 2023.
featured: true
cv: true
icon: tide-svg-1
banner: full-moon-2
tags: [open-source, code, tides, data]
synonyms: [tideline library, tide predictions]
links:
  - url: https://example.org/mira/tideline
    note: The repository, archived and read-only
  - url: https://en.wikipedia.org/wiki/Theory_of_tides
    note: The theory behind the tide tables in every almanac
files:
  - file: tideline-1-0
    title: tideline 1.0
    caption: The source, exactly as tagged on 2 April 2018
  - file: tideline-readme
  - file: doc-tides-manual
    title: The book I learned it from
    caption: A scanned manual of tides, 476 pages; chapter three is the one that matters
showcase:
  - file: tide-diagram-1
    caption: A constituent and its overtide, added together
  - file: tide-animation-1
  - file: tide-gauge-1
    caption: Somebody else's tide gauge, prettier than any I have stood beside
  - file: tide-svg-3
statuses:
  - date: 2018-04-02
    text: "1.0"
  - date: 2023-06-30
    text: Archived, with thanks
action:
  text: Download 1.0
  file: tideline-1-0
relations:
  - to: project:whitby-erosion
    kind: related
---

**tideline** is a small Python library that predicts the height of the tide at a place and a time, from that place's harmonic constituents. You give it a port's constituents and a date; it gives you the curve, and the times of high and low water. That is all it does, and for five years it did it well enough that a few people on three continents relied on it.

## Why

Dad has had a tide table pinned up behind the till at the chandlery since before I was born. I grew up knowing that the numbers on it came from somewhere, and not knowing where. In October 2017, a month into my first job, I finally sat down to find out, and [the first commit](ref:event:tideline-first-commit) was that same weekend. The whole story of why is in [Why a tide library](ref:section:tideline/why).

## How it works

A tide is the sum of many slow waves, each driven by one regular motion of the moon or the sun. Each wave is a :hint[constituent]{note="One cosine with a fixed speed set by astronomy, and an amplitude and phase that belong to one particular place."}. Add enough of them together for a given port and you get its tide, years ahead. The short version, with the words I'd have wanted at the start, is in [Constituents](<ref:section:tideline/harmonics#h:Constituents> "the heart of it, in one page"); the long version is the [page on how tides work](ref:page:how-tides-work).

## What happened to it

- **2017–2018:** evenings and weekends, then [1.0 on Easter Monday](ref:event:tideline-1-0)
- **2018–2020:** a talk, a few users, a stranger who fixed my worst bug
- **2021–2023:** maintenance from Bergen, less and less of it
- **30 June 2023:** archived, with a note of thanks to everyone who used it

:::files{title="What is left of it"}
::file[The source, exactly as tagged]{file="tideline-1-0" title="tideline 1.0"}
::file[A month of Whitby tides worked out by the library; the high water it gives is where the tidewrack lies on the beach, give or take a hand's width]{file="tides-whitby-2018-04" title="Whitby, April 2018"}
::file[The README, with its warning in capitals]{file="tideline-readme" title="README"}
:::

## Not for navigation

The README says it in capitals and I'll say it here: do not steer a boat by tideline. Use the official tables. Dad sells them.
