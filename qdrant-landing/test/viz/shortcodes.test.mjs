import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getFixtureHtml, getFixtureMarkdown, everyBuiltMarkdownFile } from './helpers.mjs';

test('viz.json defines a palette and is valid JSON', () => {
  const viz = JSON.parse(readFileSync('data/viz.json', 'utf8'));
  assert.ok(Array.isArray(viz.palette.categorical), 'palette.categorical must be an array');
  assert.ok(viz.palette.categorical.length >= 4, 'need at least 4 categorical colors');
  assert.match(viz.palette.categorical[0], /^#[0-9a-f]{6}$/i);
  assert.ok(viz.surface.ink, 'surface.ink required');
  assert.ok(viz.type.family, 'type.family required');
});

test('figure wrapper renders caption, role and aria-labelledby', () => {
  const html = getFixtureHtml();
  assert.match(html, /<figure class="viz-figure"/, 'figure wrapper missing');
  assert.match(html, /role="img"/, 'svg must carry role="img"');
  // The accessible name points at the VISIBLE figcaption. Deliberately not an
  // SVG <title>: that renders as the browser's own tooltip on hover, floating
  // over the chart's metrics tooltip and repeating the caption underneath it.
  assert.match(html, /aria-labelledby="viz-cap-smoke"/,
    'aria-labelledby must point at the figcaption id');
  assert.doesNotMatch(html, /<title id="viz-/,
    'no SVG <title> — it raises a native browser tooltip over the chart');
  assert.match(html, /<figcaption class="viz-figure__caption" id="viz-cap-smoke">Smoke test caption\.<\/figcaption>/,
    'caption must be visible and carry the id the svg points at');
});

test('no viz color is duplicated into SCSS', () => {
  const viz = JSON.parse(readFileSync('data/viz.json', 'utf8'));
  const scss = readFileSync(
    'themes/qdrant-2024/assets/css/components/_viz.scss', 'utf8').toLowerCase();
  const colors = [...viz.palette.categorical, ...Object.values(viz.surface)]
    .filter((v) => typeof v === 'string' && v.startsWith('#'));
  for (const c of colors) {
    assert.ok(!scss.includes(c.toLowerCase()),
      `${c} is defined in viz.json and must not be repeated in _viz.scss`);
  }
});

test('Markdown output carries the chart data, not the drawing', () => {
  const md = getFixtureMarkdown();

  // The whole point: an .md reader must never receive SVG. Pages build in both
  // HTML and Markdown, so without layouts/shortcodes/chart.markdown.md the HTML
  // template serves both and pastes ~26KB of gridline coordinates into a
  // document whose only audience is LLMs and markdown readers.
  assert.doesNotMatch(md, /<svg/, 'no SVG may reach the Markdown output');
  assert.doesNotMatch(md, /<figure|viz-figure|data-viz/, 'no figure chrome either');

  // Site-wide, not just this page: any future shortcode that renders a visual
  // has to make the same choice, and a per-page assertion would not notice.
  const leaks = everyBuiltMarkdownFile().filter((f) => /<svg/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(leaks, [], 'these .md files leak SVG into the Markdown output');

  // What replaces it is the chart's own source CSV, so the table cannot drift
  // from the picture: both are generated from assets/viz/hybrid/fusion.csv.
  assert.match(md, /\| dataset \| method \| ndcg \| delta \|/, 'header row missing');
  assert.match(md, /\| --- \| --- \| --- \| --- \|/, 'separator row missing');
  assert.match(md, /\| SciFact \| hybrid \(RRF\) \| 0\.7175 \| \+0\.0289 \|/,
    'data row missing or reformatted');

  // Title and caption still carry the claim the chart was making.
  assert.match(md, /\*\*nDCG@10: each retriever alone versus RRF fusion\*\*/, 'title missing');
  assert.match(md, /_Fixture chart caption\._/, 'caption missing');
});

test('HTML output still renders the chart as SVG', () => {
  // Guards the other direction: the Markdown variant must not shadow the HTML one.
  const html = getFixtureHtml();
  assert.match(html, /viz-figure--chart/, 'chart figure missing from HTML');
  assert.match(html, /<svg class="viz-figure__svg"/, 'chart SVG missing from HTML');
  assert.match(html, /data-viz-zone/, 'hover hit zones missing from HTML');
});
