# Chart typography options

Existing chart specs retain their current output. No theme, palette, or default style changes are needed.

For `grouped-columns` only, `readableType: true` opts into 1.8× the existing type roles, wrapped headings, a stacked legend, and more heading space. Set `height` to at least 480 and `legendRoom` to at least `34 × number of series + 18`. The generator rejects insufficient reserved space. This is a layout preset, not a promise of minimum rendered font size: inspect the actual article column.

Optional `width` is an integer of at least 320. Generator and HTML shortcode use the same width; omitting it preserves the shared width. Optional positive-integer `legendRoom` replaces the default bottom reservation. Avoid per-view overrides of these geometry options: all views share one outer SVG. `readableType` belongs at the top level too.

See `assets/viz/fixtures/readable.json` for a synthetic example and `content/blog/viz-typography-fixture.md` for its draft embed. CSV values, chart colors, view switching, and Markdown tables follow the existing pipeline. Inline chart assets remain generated SVG fragments, not standalone image exports.

Run `npm run viz:charts` and `npm run viz:test`. Regenerate twice and compare hashes; existing non-opted-in chart SVGs should be unchanged. Inspect all views and themes for long-heading or legend collisions. These options apply to generated charts, not interactive islands, static diagrams, or other chart kinds' large-type layout. A separate responsive solution is still needed where a fixed-viewBox figure falls below readable sizes.

## Independent sizing and legends

New grouped-column charts can use `textScale` (a number from 0.75 to 2.5) and `legendLayout` (`auto`, `row`, or `stacked`) independently. `auto` uses one row when the complete labels fit; otherwise it stacks and wraps them. An explicit `row` fails generation if it would clip. These settings currently apply only to grouped-column charts; other chart kinds reject them instead of silently ignoring them. Islands retain their own layout and typography.

```json
{
  "textScale": 1.4,
  "legendLayout": "auto",
  "width": 800,
  "height": 400
}
```

These are additional top-level fields on a normal chart spec, not a complete spec. Text scale multiplies the existing named type roles. It defaults to 1, although `readableType: true` still supplies 1.8 when no explicit scale is set. An explicit scale overrides that legacy preset's scale. Either new field opts into calculated heading and legend spacing. The tallest heading across all views reserves one consistent plot area; legend space is calculated and stored in the generated SVG for Hugo to consume. `height` includes the heading and plot, excluding the automatically reserved legend. Leave `legendRoom` out unless you need extra whitespace; a value smaller than the required space is rejected. At least 140 SVG units must remain for the plot. Overlong axis labels fail generation with a sizing hint. Alternate views must share the same data source, chart kind, and series field. Regenerate after changing any layout option. Existing specs without either new field remain byte-identical, including the original `readableType` preset.

These dimensions are SVG units, not guaranteed on-screen font sizes. Inspect actual article widths and all views. These options do not add responsive plot reflow or remove the existing narrow-screen scrolling policy. Blog chart chrome and tooltips now follow the blog's light-only surface; theme-aware pages retain their existing explicit/system theme behavior. Series colors and values do not change with either policy.
