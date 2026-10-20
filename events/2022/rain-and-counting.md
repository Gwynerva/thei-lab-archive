---
title: 'Rain: 21 days & counting (!) — the "dry" spell?'
summary: The rain counter said twenty-one days and counting for nearly two weeks, because of one day that wasn't quite dry
periods:
  - 2022-11-05
tags: [rain, bergen]
reminder: Fix the dry-day threshold in the rain counter before next autumn
files:
  - file: rain-counter-export
    title: The export, with the stuck fortnight in it
relations:
  - to: project:rain-counter
    kind: related
  - to: event:rain-streak
    kind: related
    note: the streak, and the bug it left behind
---

For nearly two weeks the little screen on the kitchen shelf has said the same thing: **Rain: 21 days & counting (!)**. I wrote that message myself, brackets and exclamation mark and all, in a fit of pride on day twenty-one. I liked seeing it every morning. I didn't think about it.

Tonight Jonas, making tea, said, "Is it still counting? It was sunny on Monday." It was. And on the 24th of October, [the day it stopped](<ref:event:rain-streak#h:The day it stopped> "blue sky, at last"), and on a few days since.

So I sat down with the code.

:::spoiler
The 24th wasn't dry. Not by my rules. The gauge caught 0.4 mm overnight, fog dripping off the gutter, and I'd written the app so that a dry day is under 0.2 mm and a rain day is over 0.5. The 24th fell into the gap between the two. Faced with a day that was neither, the code did what bad code does: it fell over, quietly, a minute after midnight, and the screen went on showing the last thing it had been told. For eleven days.
:::

So my famous dry spell was one day long, and not dry. I've fixed it: there's no gap now, a day is one thing or the other, as it should have been from the start. Tonight the screen says **Rain: day 2**, which is honest, if less exciting.

::card[Where the counting started, back in October]{to="ref:event:rain-streak#:~:text=umbrella"}

Jonas says I should put the old message back up anyway, for morale. I'm tempted.
