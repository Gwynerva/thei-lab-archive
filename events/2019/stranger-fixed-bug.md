---
title: A stranger fixed my bug
summary: Somebody I've never met worked out why tideline was an hour out, and sent the fix
periods:
  - 2019-05-18
banner: tide-diagram-1
tags: [open-source, code]
links:
  - url: https://example.org/tideline/pull/14
    note: The pull request
files:
  - file: tideline-readme
    title: The README, with one new line in it
notes: |
  Add a **contributors** section to the README. Write back properly, not just "thanks!".
relations:
  - to: project:tideline
    kind: related
---

A pull request on [tideline](ref:project:tideline "my little tide library") this morning, from an account I'd never seen: someone in New Zealand who uses it for a harbour I'd never heard of. The title:

> Predictions are one hour late whenever the clocks have changed

They were right. The library worked out the time of high water perfectly well in UTC, then converted it to local time using the offset of the *first* day of the year, all year round. In January, in Scotland, that's the same thing. In July it's an hour out. I'd tested it on Leith, in winter. Every test I ever wrote, I wrote in winter.

Their fix was eleven lines, plus a test that runs a whole year of tides through a change of the clocks. Neater than anything I'd have written. They also tidied a comment of mine about the :hint[M2]{note="the main lunar constituent, two high waters a day"} constituent, which was right but muddled. (My notes on [the constituents](<ref:section:tideline/harmonics#h:Constituents>) are still all mine.)

::link[The pull request, merged]{url="https://example.org/tideline/pull/14"}

I merged it, released 1.2.1, and sat there for a minute feeling strange. Somebody I'll never meet, on the other side of the world, read my code closely enough to find my mistake, and instead of complaining about it, fixed it. That's the whole idea of open source. I've known it for years. It had just never happened to me.
