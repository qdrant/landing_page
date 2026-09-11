import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getFixtureHtml } from './helpers.mjs';

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
