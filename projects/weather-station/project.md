---
title: A weather station on the balcony
summary: Sensors on a Raspberry Pi, a reading every ten minutes from a balcony in Leith and then a window in Bergen, until the rain won.
icon: raspberry-pi-3
banner: weather-sensors-2
tags: [raspberry-pi, weather, data, code, lockdown]
synonyms: [the balcony station]
links:
  - url: https://en.wikipedia.org/wiki/Raspberry_Pi
  - url: https://www.met.no
    note: The Norwegian forecasters, who do this properly
files:
  - file: station-config
    title: The station's settings
    caption: Sensors, offsets and the ten-minute interval, as it ran in Leith
  - file: weather-leith-2020-06
  - file: weather-bergen-2022-10
    title: The last month, Sandviken
    caption: October 2022, the twenty-one days of rain, hour by hour
showcase:
  - file: raspberry-pi-1
    caption: A newer Pi than mine, but the same green board
  - file: weather-sensors-1
    caption: What a real weather station looks like, for comparison
  - file: weather-animation
---

I built a weather station in the spring of 2020, in lockdown, because I needed something to count that wasn't days. It sat on the balcony of the flat in Leith, four floors up, cable-tied to the railing beside the tomatoes, and took a reading every ten minutes for two and a half years.

## What it measured

- temperature and humidity, inside a shield of stacked plant saucers
- air pressure, on the same tiny board
- rain, with a tipping bucket that clicked once for every fifth of a millimetre
- wind, with a set of cups on a broom handle, which the gulls loved to sit on

Every reading went to a small database on [the home server](ref:project:home-server), and every morning a little chart of the last day was waiting on my phone. It went online on [14 June 2020](ref:event:weather-station-online). I sited it wrongly in every way the [Met Office's guidance](https://www.metoffice.gov.uk "which my balcony breaks in four separate ways") warns about: too close to a wall, too high, too sheltered from the west and too near a kitchen window. I knew. It didn't matter. It was *my* weather.

## Why it mattered

That year the weather was the news I could stand. Rain on the window, the walk, bread, the cat, the numbers. When Nana was dying, in November, the station went on counting through the days I didn't, and afterwards I found I could look at those charts and remember exactly which hours were which.

## After

In 2021 it moved with me to Bergen, in a biscuit tin, and went up again on a window ledge in Sandviken, where it learned what rain actually is. On 30 October 2022, a week after [twenty-one days of rain](ref:event:rain-streak), the board in the shield had corroded green and the rain bucket was full of moss, and I retired it. The data is all here, in files nobody else will ever open, and I am glad of every row.
