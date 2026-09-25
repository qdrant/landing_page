# Chart typography options

Existing chart specs retain their current output. No theme, palette, or default style changes are needed.

For `grouped-columns` only, `readableType: true` opts into 1.8× the existing type roles, wrapped headings, a stacked legend, and more heading space. Set `height` to at least 480 and `legendRoom` to at least `34 × number of series + 18`. The generator rejects insufficient reserved space. This is a layout preset, not a promise of minimum rendered font size: inspect the actual article column.

Optional `width` is an integer of at least 320. Generator and HTML shortcode use the same width; omitting it preserves the shared width. Optional positive-integer `legendRoom` replaces the default bottom reservation. Avoid per-view overrides of these geometry options: all views share one outer SVG. `readableType` belongs at the top level too.

See `assets/viz/fixtures/readable.json` for a synthetic example and `content/blog/viz-typography-fixture.md` for its draft embed. CSV values, chart colors, view switching, and Markdown tables follow the existing pipeline. Inline chart assets remain generated SVG fragments, not standalone image exports.

Run `npm run viz:charts` and `npm run viz:test`. Regenerate twice and compare hashes; existing non-opted-in chart SVGs should be unchanged. Inspect all views and themes for long-heading or legend collisions. These options apply to generated charts, not interactive islands, static diagrams, or other chart kinds' large-type layout. A separate responsive solution is still needed where a fixed-viewBox figure falls below readable sizes.
