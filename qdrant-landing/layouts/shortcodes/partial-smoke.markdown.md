{{- /*
  partial-smoke, Markdown output — test fixture only, never published.

  The viz-figure partial emits SVG unconditionally, which is correct: it is the
  HTML component. Choosing SVG-or-data is the shortcode's job, because only the
  shortcode is resolved per output format (see chart.markdown.md). This variant
  exists so the fixture page obeys the same rule as real content, which lets the
  test assert the invariant across every built .md rather than exempting one page.
*/ -}}
_Smoke test caption._
