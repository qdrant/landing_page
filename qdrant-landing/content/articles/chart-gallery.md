---
title: "Chart gallery (temporary)"
short_description: "Every chart kind in one place, drawn with made-up data, so the look can be reviewed without hunting through six posts."
description: "Temporary review page showing each chart kind the blog can render. All numbers are invented."
author: Qdrant
date: 2026-09-18T00:00:00+03:00
draft: false
category: qdrant-internals
# `build` (not `_build`: that key was removed in Hugo 0.145; the pipeline runs 0.160.1)
build:
  list: never
  render: always
  publishResources: true
sitemap_exclude: true
robots: noindex, nofollow
---

**This page is temporary and unlisted.** It exists so the chart work can be reviewed
in one place instead of across six posts. Every number below is invented. None of it
describes Qdrant or any other system.

It is not linked from anywhere and is excluded from the sitemap and from search
engines. Delete `content/articles/chart-gallery.md` and the `gallery/*` entries in
`data/viz-charts.json` to remove it.

## What every chart shares

- Drawn at build time as inline SVG, from a CSV in the repo. Nothing is a picture.
- Colours come from the brand data-visualisation sequence, via `data/viz.json`.
- Chrome colours follow the page theme, including the reader's system setting.
- A caption is required; it is also the figure's accessible name.
- Hover needs JavaScript. Without it you still get the whole chart, just no tooltip.

## Columns, two panels

For one set of things measured two ways. Hovering a column rings that row in **both**
panels at once and reads out every metric, not just the one in the panel you are over.

{{< chart id="gallery/columns" caption="Two measurements of the same three configurations. Hover any column to see both at once." >}}

## Grouped columns

For several groups compared across several methods. Use this when the reader needs to
compare within a group and across groups at the same time.

{{< chart id="gallery/grouped" caption="Three methods across five sets. Method B loses on two of the five, which is the point of showing it." >}}

## Lines, faceted, log scale

For a value swept across a range, split into small panels. The log axis earns its place
when the data spans orders of magnitude: here from 0.3 to 470, which a linear axis would
flatten into a straight line along the bottom.

{{< chart id="gallery/lines-log" caption="Two series over four steps, in two groups. Hovering a column drops a crosshair and reads out both series at that step." >}}

## Lines, single panel, linear scale

The same kind without faceting and without the log axis, for a parameter sweep where the
numbers sit in one range. Both series share a unit, which is the only case where putting
two lines on one axis is honest.

{{< chart id="gallery/lines-linear" caption="A parameter sweep showing diminishing returns. Tooltip rows are ordered by value, so their order matches how the lines stack." >}}
