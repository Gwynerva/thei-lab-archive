---
title: The weather station goes online
summary: A Raspberry Pi in a lunchbox on the balcony, reading the sky every ten minutes
periods:
  - 2020-06-14
banner: raspberry-pi-3
tags: [raspberry-pi, weather, data]
files:
  - file: station-config
    title: The station's settings
  - file: weather-leith-2020-06
    title: The first fortnight of readings
action:
  text: Live readings
  link: https://example.org/balcony-weather
relations:
  - to: project:weather-station
    kind: related
---

Walk 83, and the station is live.

What it is: a Raspberry Pi in a plastic lunchbox with holes drilled in the bottom, screwed to the balcony wall in the shade. A sensor for temperature, humidity and pressure on a cable outside the box; a little rain gauge with a seesaw bucket that tips and clicks every 0.2 mm; and a wind cup made from three halves of a plastic Easter egg, which spins more or less in proportion to the wind. Every ten minutes a script reads them all and writes a line to a file, and once an hour it sends the averages to a page anyone can open.

First reading, ten past two this afternoon: 17.4 °C, 61 per cent, 1014 hectopascals, no rain, a light breeze from the south-west. Accurate, as far as I can tell by sticking my hand out of the window.

:::files{title="The station's files"}
::file[How every sensor is set up, in one file]{file="station-config" title="Settings"}
::file[Every hour since it started]{file="weather-leith-2020-06" title="Readings, June 2020"}
:::

I've lived with the weather my whole life, Dad and his tides, Nana and her sea, and now I can see it in a table. Biscuit sat watching the wind cup for an hour. He thinks it's a bird.
