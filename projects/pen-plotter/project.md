---
title: A pen plotter for contour lines
summary: Two stepper motors, a servo and a fountain pen, drawing contour lines on the kitchen table in Leith.
icon: stepper-motor
banner: pen-plotter-1
tags: [plotter, maps, code, craft]
synonyms: [the plotter]
links:
  - url: https://en.wikipedia.org/wiki/Plotter
    note: What a plotter is, and what the big ones were for
files:
  - file: plotter-contours
    title: Contours as G-code
    caption: The file the plotter drew the first contour from
  - file: plotter-settings
showcase:
  - file: contour-svg-1
    caption: The principle, which I drew for myself before I built anything
  - file: contour-map-2
    caption: Old survey contours, the kind I wanted the pen to draw
  - file: fountain-pen
    caption: Nib tests, before I chose the one that went in the plotter
  - file: pen-plotter-2
relations:
  - to: project:walk-atlas
    kind: related
---

In the spring of 2021, between a job interview in Bergen and a residence permit that took three months, I built a machine that draws contour lines with a fountain pen.

It is small and slow. A frame of aluminium rails on the kitchen table, two stepper motors moving the pen across and along, and a tiny servo that lifts the pen off the paper between lines. It doesn't print anything. It *draws*, one line at a time, the way a surveyor's draughtsman would have inked a sheet, and the ink pools a little at the corners in the same way.

## Why contours

Contour lines are the thing I love most on a map. Every line is a height, every gap a slope; if you know how to read them a flat sheet of paper stands up off the table. A printer turns them into dots. I wanted a pen that walked along each one.

## What it drew

- [the first contour](ref:event:first-plot), on 10 April 2021: one line round Arthur's Seat, at 200 metres, a bit wobbly
- then the whole of Arthur's Seat at ten-metre intervals, which took four hours
- then every hill I loved in Scotland, one a week until I left, as a goodbye
- and, last, the hills around Bergen, as a hello

It came to Norway in a shoebox and sits on the shelf above my desk. Since 2025 it has had a proper job: it draws faint pencil contours on sheets of watercolour paper, and I ink the [walk atlas](ref:project:walk-atlas) maps over them by hand. Nobody can tell where the machine stops and I begin, which is how it should be.
