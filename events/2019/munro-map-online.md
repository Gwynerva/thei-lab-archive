---
title: The Munro map goes online
summary: Twelve green dots and two hundred and seventy grey ones, on a map anyone can open
periods:
  - 2019-01-20
banner: munro-cairn-2
tags: [web-maps, munros, code]
links:
  - url: https://example.org/munro-map
    note: The map itself
  - url: https://en.wikipedia.org/wiki/Munro
    note: What a Munro is, for the English
files:
  - file: munro-map-source
    title: The map's source
    caption: One HTML page and one GeoJSON file. That's all it is.
  - file: munro-list
action:
  text: Open the map
  link: https://example.org/munro-map
relations:
  - to: project:munro-map
    kind: related
---

Pressed the button at twenty to midnight, which is not when sensible people launch things, but it was Sunday and I'd promised myself January.

The map shows all 282 :hint[Munros]{note="Scottish mountains over 3,000 feet, 282 of them on the current list"}, a dot for each. The ones I've climbed are green, the rest a patient grey. Twelve green. Two hundred and seventy grey. Seen like that it's less a map than a to-do list with contour lines.

## How it works

Nothing clever. The hill list is a spreadsheet I've kept since [Ben Lomond](ref:event:ben-lomond); a script turns it into GeoJSON, and a small page draws it over an open basemap. Click a dot and you get the height, the date, and one line about the day ("rain", mostly). When I climb another, I change one cell and it goes green.

Eleven weeks of evenings, most of them spent arguing with myself about the exact shade of the grey.

Dougie asked why I'd spend my free time making maps when I spend all day making maps. Fair question. But nobody at work lets me colour a mountain green.
