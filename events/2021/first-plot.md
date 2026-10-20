---
title: The plotter draws its first contour
summary: Two stepper motors, a servo and a fountain pen draw the contours of Arthur's Seat
periods:
  - 2021-04-10
banner: pen-plotter-1
tags: [plotter, maps, code]
files:
  - file: plotter-settings
    title: The settings that finally worked
action:
  text: Download the G-code
  file: plotter-contours
relations:
  - to: project:pen-plotter
    kind: related
---

It drew a line. A wobbly, slightly hairy line, but it is the 60-metre contour of Arthur's Seat, and it is drawn in ink, by a machine I built out of two drawer runners, two stepper motors, a servo that lifts the pen, and Nana's old fountain pen.

The trick, after a month on the frame: the pen has to come down slowly, or the nib digs in and splatters. I spent most of the afternoon changing one number in the settings and drawing the same small circle forty times. Marta looked in at the thirty-first circle and backed out again without a word.

Then the real thing: elevation data for the hill, contours every ten metres, sent to the plotter one line at a time. It took an hour and twenty minutes for nineteen lines. I sat on the floor and watched every one of them.

::media[The principle, which I now understand in my wrists]{file="contour-svg-1"}

:::files{title="What the plotter ran on"}
::file[The contours, as the plotter reads them]{file="plotter-contours" title="Arthur's Seat, G-code"}
::file[Speeds, pen lift and the one number that mattered]{file="plotter-settings" title="Settings"}
:::

I'm going to plot Bergen next. All seven mountains, if the pen holds out.
