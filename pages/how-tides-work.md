---
title: How tides work
summary: Why the sea at Whitby rises and falls twice a day, what the moon and the sun have to do with it, and how a tide table is worked out from a handful of cosines.
icon: full-moon-1
synonyms: [tides, tide tables, tidevann, harmonic analysis]
notes: |
  Check the Whitby numbers against the official table before anyone quotes them back at me.

  Ask Dad whether the shop still has the old tide clock from the eighties.
---

Dad has kept a tide table pinned behind the till of the shop on Whitby harbour since before I was born. Every January a new one goes up and the old one goes in a drawer, and every customer who comes in for rope or a shackle glances at it on the way out. I grew up thinking that everyone knew, without looking, whether the tide was coming in. It took me twenty-five years, a degree and a small software library to understand *why* it does.

This is the explanation I wish someone had given me at twelve, on the harbour wall with a bag of chips. It is not, I should say at once, for navigation: if you're going to sea, use the official tables, and look at the sky.

## What a tide is

Twice a day, more or less, the sea at Whitby rises by four or five metres and falls again. At high water the boats ride level with the road; six hours later they sit tilted on the mud with their ropes hanging slack.

High water comes about fifty minutes later each day: if it's high at nine this morning, it will be high at about ten to ten tomorrow. The average time from one high water to the next is twelve hours and twenty-five minutes, and the first clue to why is that the moon rises about fifty minutes later every day, too.

## The moon

Everybody knows the moon pulls the sea. What took me longest to understand is why that gives you *two* high tides a day and not one, and the answer is that the moon doesn't simply pull. It pulls *unevenly*.

Gravity weakens with distance. The side of the Earth facing the moon is about 6,400 km closer to it than the centre of the Earth is, and the far side is 6,400 km further away. So the moon pulls the near-side ocean a little more strongly than it pulls the Earth as a whole, and pulls the Earth as a whole a little more strongly than the far-side ocean. What matters for the tide is the difference. The near-side water is pulled away from the Earth, towards the moon; the Earth is pulled away from the far-side water, which gets left behind. You end up with two bulges, one under the moon and one on the opposite side of the planet.

::media[The two bulges, one facing the moon and one facing away]{file="tide-svg-1" layout="centered"}

The Earth turns underneath them once a day, so any one place, Whitby, say, passes under both bulges in a day: two high waters, with a low between each. But while the Earth turns, the moon moves on along its orbit, and the Earth has to turn a little further, about fifty minutes' worth, to catch it up. That's why the tidal day is 24 hours and 50 minutes long, and why there are two tides in it, each about 12 hours and 25 minutes apart.

The moon's tide-raising pull is about a ten-millionth of the Earth's own gravity. :hint[It is enough]{note="Because it acts on the whole ocean at once, all the time, and the ocean is very large and has nowhere else to be."} to move most of the water on the planet.

### When the moon is north or south

The moon doesn't stay over the equator. Over a month it swings north and south of it, by as much as twenty-eight degrees, and the bulges swing with it. When the moon is far to the north, a place like Whitby passes through the thick part of one bulge and the thin edge of the other, so one high water of the day is higher than the other. Sailors call it the *diurnal inequality*. I call it the reason the evening tide always seemed bigger when I was small, which, in summer, it sometimes was.

::media[The bulge tilting as the moon moves north and south of the equator]{file="tide-animation-1" layout="natural"}

The moon's orbit isn't a circle, either. Once a month it comes closest to us, at *perigee*, and the tides that week are about a fifth bigger. When perigee falls on a spring tide, you get the ones that make the local news.

## The sun, and spring and neap

The sun raises tides too. It's twenty-seven million times heavier than the moon but nearly four hundred times further away, and the tidal force falls off with the *cube* of the distance, so in the end the sun manages a little less than half of what the moon does. Not nothing.

Twice a month, at new moon and full moon, the sun, the moon and the Earth are in a line, and their bulges stack on top of each other. Those are **spring tides**: the highest highs and the lowest lows, and nothing to do with the season. A week later, at the half moons, the sun pulls at right angles to the moon and partly fills in its lows. Those are **neap tides**, small and lazy. At Whitby a spring tide rises about four and a half metres, a neap a little over two. From one spring to the next is fourteen and three-quarter days.

::media[Springs at new and full moon, neaps at the quarters]{file="tide-svg-2" layout="centered"}

The springs don't come on the day of the full moon, though. They come a day or two after it. :hint[The age of the tide]{note="That lag, between the full moon and the biggest tide, has a lovely old name. It's different in every port, and in some it's nearly three days."} is the first sign that the real ocean isn't doing quite what the simple picture says.

## The sea is not a bulge

Here is what nobody told me at school. The two neat bulges, sliding round the planet under the moon, are a fiction. A useful fiction, with a name: the *equilibrium tide*, the shape the ocean would take if it could keep up. It can't.

For a bulge to stay under the moon it would have to travel round the equator at about 1,600 km an hour, and the ocean isn't deep enough to carry a wave that fast; besides, there are continents in the way. So the real tide is a set of enormous, slow waves sloshing round each basin, steered by the coasts and swung sideways by the turning of the Earth.

In each basin they wheel round places where the tide hardly rises at all, called :hint[amphidromic points]{note="From the Greek, roughly 'running round'. The tide goes round them like the hand of a clock."}. In the northern hemisphere the tide goes round them anticlockwise. The North Sea has three. One of them sits off the south-western corner of Norway, which is why the tide at Stavanger is barely half a metre and Oslo hardly notices it, while Bergen, further away, gets a metre and a bit, and Lofoten, much further, gets three.

The tide comes into the North Sea round the top of Scotland and runs south down the east coast of Britain as a long, slow swell, hundreds of kilometres from crest to crest: high water at Aberdeen first, then Leith, then Whitby an hour or so later, then the Humber, at about the speed of a train.

There's [a section in the tideline project](<ref:section:tideline/harmonics#h:The equilibrium tide> "the same idea, with the sums") that goes further into this than I'd dare to here.

## Harmonics

So if the real tide is too complicated to work out from the moon and the sun, how does anyone make a tide table? The answer is one of the most beautiful ideas I know, and it belongs to the nineteenth century: you stop trying to explain the tide, and *describe* it instead.

Whatever the ocean does with them, the forces that raise the tide repeat on known schedules: the moon every 24 hours and 50 minutes, the sun every 24, the moon's swing north and south and its slide from near to far each on their own. Each rhythm makes the sea at one place go up and down at its own exact speed. Nobody can say in advance *how much* each will move the sea at Whitby, or how late it will arrive; that depends on the shape of the whole North Sea. But you can measure it. Record the water at Whitby every hour for a year, and you can pull the rhythms apart again, like picking the notes out of a chord.

Each of those rhythms is a :hint[constituent]{note="One pure up-and-down: a cosine with its own speed, its own size (the amplitude) and its own lateness (the phase) at a given place."}, and a tide table is what you get when you add them all back together for the days ahead.

### Constituents

There are dozens. A port's official predictions might use sixty or more. But a handful do most of the work, and they have names like bus routes:

- **M2**, the principal lunar tide: the moon's two bulges, coming round every 12.42 hours. At Whitby its amplitude is nearly two metres, by far the largest.
- **S2**, the principal solar tide: the sun's, exactly every 12 hours. About a third the size of M2 at Whitby.
- **N2**: the moon's changing distance, which shows up as a tide of its own, a little slower than M2.
- **K1** and **O1**: the once-a-day tides, from the moon and the sun being north or south of the equator. Small in the North Sea; large in some other seas, where there's only one tide a day.
- **M4**: an *overtide*, made when the M2 wave runs into shallow water and gets bent out of shape. More about that below.

The lovely thing is what happens when you add M2 and S2 together. One comes round every 12 hours and 25 minutes, the other every 12 hours exactly, so they drift in and out of step over fourteen and three-quarter days. In step, they add up: springs. Out of step, they cancel: neaps. The whole spring and neap cycle falls out of two cosines. The evening in 2017 when I saw it happen in a plot on my laptop in Leith, I said "oh" out loud to an empty kitchen.

The [constituents for Whitby](<ref:section:tideline/harmonics#h:Constituents> "and the four I used") that I worked from were rough, just four of them from a published table. They were enough to get the time of high water right to about a quarter of an hour, which is enough to be interesting and not nearly enough to go to sea on.

::media[Whitby harbour mouth: everything on this page, in one view]{file="whitby-harbour-4" layout="stretch"}

### Doing the sums

Once you have the constituents, the prediction is, honestly, arithmetic:

1. Start from the mean level of the sea at the port.
2. For each constituent, work out where it is in its cycle at the moment you want: its speed times the time, plus where it started, minus its local lateness.
3. Take the cosine of that, multiply by the constituent's amplitude, and add it on.
4. Do that for every constituent, every few minutes, for the whole year.
5. Find the turning points. Those are your high and low waters.

There's one more wrinkle. The moon's orbit itself wobbles slowly, on a cycle of 18.6 years, which makes some constituents a few per cent bigger or smaller from one year to the next. So each year's amplitudes get a small correction, the :hint[nodal factor]{note="Named after the nodes of the moon's orbit, the two points where it crosses the plane of the Earth's. They go all the way round once every 18.6 years."}. Leave it out and your high waters are a few centimetres out, which nobody on the harbour wall would notice, and which annoyed me for a month.

For a hundred years this was done by machines of brass and mahogany, a pulley for every constituent and one wire running over them all, so that the pen at the end drew the sum. Lord Kelvin built the first in the 1870s. [There's a photograph of one on Wikipedia](https://en.wikipedia.org/wiki/Tide-predicting_machine) that I could look at for an hour. [tideline](ref:project:tideline), my library, does what those machines did in a tenth of a second, with much less to admire.

## Shallow water

All of this assumes the sea is deep. Near the coast it isn't, and a tide wave in shallow water slows down in the troughs more than at the crests, so the crest catches up with the trough ahead of it, the way a wave steepens on a beach, only over hours. In a shallow harbour the tide often rises faster than it falls, and its curve goes lopsided.

The harmonic method copes with this beautifully, which is what I like best about it: the lopsidedness is just more constituents, at twice and three times the speed of M2. They're called overtides, like the harmonics of a cello string, and in a few places they get so big that you see two high waters close together, with a little dip between.

::media[M2 plus its first overtide: the sum rises faster than it falls]{file="tide-diagram-2" layout="natural"}

At Whitby the River Esk muddles the bottom of the tide after rain on the moors. Dad will tell you the table is right, and then tell you to give it twenty minutes.

## Weather

A tide table predicts what the moon and the sun will do. It knows nothing about the weather, and the weather has opinions.

Low pressure lets the sea rise, about a centimetre for every hectopascal the barometer falls. A northerly gale blowing for days down the North Sea piles water up against the coast, a metre or more above the table. That's a :hint[storm surge]{note="The North Sea is notorious for them: long, shallow, and closed at the south end like a bath."}, and when it arrives on top of a spring tide, it floods towns.

When [Storm Dennis](ref:event:storm-dennis) came through Whitby in February 2020, waves were breaking over the end of the West Pier and Dad had sandbags in the shop doorway by teatime. The table for that day said nothing unusual at all.

> Never trust a calm sea.

That was Nana June, who was married to a merchant seaman and had her own views about tables.

## Reading a tide table

A tide table gives the time and height of every high and low water. The heights are measured from :hint[chart datum]{note="Roughly the lowest the tide ever goes from astronomy alone, so the depths on a chart are the least you'll find, and the heights in a table are almost never below zero."}, and in Britain the times are given in winter time, so in summer you add an hour. Every summer, somebody forgets.

For the heights in between, there's an old rule of thumb, the *rule of twelfths*. Over the six hours from low water to high, the tide rises by:

1. one twelfth of its range in the first hour,
2. two twelfths in the second,
3. three twelfths in the third,
4. three twelfths in the fourth,
5. two twelfths in the fifth,
6. and one twelfth in the sixth.

So the sea comes in fastest in the middle two hours, which is exactly when you don't want to be halfway along the beach under the cliffs between Saltwick and Whitby. People get cut off there every summer.

## Further reading

:::files{title="Tide tables and old books"}
::file[A manual of tides, all 476 pages of it, which taught me the harmonic method]{file="doc-tides-manual" title="A manual of tides"}
::file[A month of predictions for Whitby from tideline 1.0, for interest only, never for navigation]{file="tides-whitby-2018-04" title="Whitby tides, April 2018"}
::file[Old Atlantic tables, for the pleasure of the typesetting]{file="doc-tide-tables-1" title="Atlantic tide tables"}
:::

For the proper science, [Tide](https://en.wikipedia.org/wiki/Tide) and [Theory of tides](https://en.wikipedia.org/wiki/Theory_of_tides "the long version, with the equations") on Wikipedia. And for how I came to care about any of this, [the project](ref:project:tideline) and [the evening of its first commit](ref:event:tideline-first-commit).

::media[The full moon, which does most of this]{file="full-moon-1" layout="centered"}
