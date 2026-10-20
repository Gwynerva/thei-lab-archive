---
title: "tideline: the first commit"
summary: The first evening's code of a little library that predicts tides from harmonic constituents
periods:
  - 2017-10-14
banner: tide-svg-1
tags: [code, open-source, tides]
files:
  - file: doc-tides-manual
    title: The book I'm learning it from
relations:
  - to: project:tideline
    kind: related
---

Started a thing tonight. A small Python library that predicts tides, because Dad's tide tables come in a little yellow booklet every year and I want to know how they're made.

Here's how, briefly: the tide is the sum of lots of waves with known speeds, one for each push and pull of the moon and the sun, and each harbour has its own sizes and timings for them. Those are the :hint[constituents]{note="the separate tidal waves, each with its own period; M2, the main lunar one, repeats every 12.42 hours"}. Add them up and you get the tide. There's more about [the constituents](<ref:section:tideline/harmonics#h:Constituents> "the slightly longer version") in the project, and [the long version](https://en.wikipedia.org/wiki/Theory_of_tides "the theory of tides, which I've read twice and understood once") if you have a free week.

Tonight I got as far as M2 and S2, the two biggest, for Whitby, with numbers from an old paper. My curve has high water about forty minutes off the booklet. That's either a bug or the other hundred constituents. Probably both.

The first commit message is "tides, roughly". It's called *tideline*. It's on the internet now, which feels like standing on a chair in public.
