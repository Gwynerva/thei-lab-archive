---
title: The frame
periods:
  - 2021-03-06..2021-04-04
---

Four weekends. The frame went together in roughly this order:

1. two aluminium rails and a cross-bar, from a kit meant for a laser engraver
2. belts and pulleys, which took an evening of swearing to tension
3. the two stepper motors, one for each direction
4. a servo on the carriage to lift and drop the pen
5. a clamp for the pen made from a ~~3D-printed bracket~~ wooden clothes peg and two cable ties, because the bracket snapped and the peg didn't

::media[One of the little stepper motors, on the cutting mat where it lived for a month]{file="stepper-motor" layout="centered"}

The motors are driven by a small board running open firmware that understands G-code, the same language big machines use: *move here, pen down, move there, pen up*. I wrote a script that turns contour lines from a height map into those instructions, sorted so that the pen travels as little as possible between lines.

By 4 April it moved in straight lines and drew squares. The squares were slightly not square. I fixed that on the Saturday.
