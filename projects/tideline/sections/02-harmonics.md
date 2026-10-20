---
title: How tides are predicted, briefly
summary: Constituents, their speeds, and the tide the ocean would have if it were simpler.
---

This is the explanation I wish someone had given me in 2017. It leaves a lot out.

::media[The two bulges: one under the moon, one on the far side of the earth]{file="tide-svg-1" layout="centered"}

## Constituents

The moon and the sun pull on the oceans in patterns that repeat. Each repeating pattern gives the tide one regular wave, a **constituent**, with its own fixed speed. The speeds come from astronomy and are the same everywhere on Earth. The biggest ones have names that sound like a code, because they are:

- **M2**, the principal lunar wave: one cycle every 12 hours and 25 minutes. At most British ports it is most of the tide.
- **S2**, the principal solar wave: exactly 12 hours.
- **N2**, which follows the moon's distance and has a cycle of 12 hours 40.
- **K1** and **O1**, the daily waves, about 24 and 26 hours, which make one high water of the day higher than the other.

What is *not* the same everywhere is how big each wave is at a given port, and how late it arrives. Those two numbers, the amplitude and the phase, are what you measure: a year of gauge readings, fitted by least squares. tideline takes them as its input and adds the waves up for any date you ask.

### Overtides

In shallow harbours the waves distort, and the sum needs extra, faster constituents to catch it. Whitby needs a few. My first version didn't have them and was twenty minutes out.

## The equilibrium tide

The equilibrium tide is the tide the ocean *would* have if it covered the whole Earth, was deep everywhere and answered the moon at once. It doesn't exist. But it is the reference everything is measured against: each real constituent is the equilibrium wave, made larger or smaller by the shape of the coast and delayed by the time the water takes to get there.

For the long version, with the moon in it, see [the page on how tides work](<ref:page:how-tides-work#h:The moon> "the moon, and why there are two tides a day").
