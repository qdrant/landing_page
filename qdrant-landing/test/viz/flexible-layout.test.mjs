import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { chartLayout } from '../../scripts/viz/chart-layout.mjs';
import { buildSite } from './helpers.mjs';

const type = { title: 21, subtitle: 18.2, axis: 18.2, label: 16.8 };
const base = { id: 'example', width: 800, height: 400, title: 'Example', subtitle: 'Measured time', legendLayout: 'auto' };
const series = ['Method A', 'Method B', 'Method with a longer label'];

test('automatic legends keep whole labels in one row when they fit and stack otherwise', () => {
  const wide = chartLayout(base, series, type);
  assert.equal(new Set(wide.legend.map(item => item.y)).size, 1);
  const narrow = chartLayout({ ...base, width: 320 }, series, type);
  assert.equal(new Set(narrow.legend.map(item => item.y)).size, 3);
  assert.ok(narrow.legend[2].lines.length > 1);
  assert.ok(narrow.height > wide.height);
  for (const layout of [wide, narrow]) {
    for (const item of layout.legend) {
      assert.ok(item.x >= 0);
      assert.ok(item.y + (item.lines.length - 1) * type.label * 1.5 < layout.height);
    }
  }
});

test('heading space accommodates the longest view without changing plot geometry between views', () => {
  const layout = chartLayout({ ...base, views: [{ subtitle: 'Short' }, { subtitle: 'Longer heading '.repeat(14) }] }, series, type);
  assert.ok(layout.headings[1].lines.length > layout.headings[0].lines.length);
  assert.ok(layout.top > layout.headings[1].bottom);
  assert.throws(() => chartLayout({ ...base, height: 100 }, series, type), /less than 140/);
  assert.throws(() => chartLayout({ ...base, width: 320, legendLayout: 'row' }, series, type), /row does not fit/);
  assert.throws(() => chartLayout({ ...base, legendRoom: 1 }, series, type), /legendRoom/);
  assert.throws(() => chartLayout({ ...base, yLabel: 'A very long measurement label '.repeat(8) }, series, type), /y-axis label does not fit/);
  assert.throws(() => chartLayout(base, series, type, ['A category name '.repeat(10), 'Other']), /group labels do not fit/);
});

test('Hugo uses generated height and retains view captions and agent-readable data', () => {
  const root = buildSite();
  const html = readFileSync(`${root}/blog/viz-typography-fixture/index.html`, 'utf8');
  const doc = new JSDOM(html).window.document;
  const svg = doc.querySelector('[aria-labelledby="viz-cap-fixtures-flexible"]');
  const height = svg.querySelector('[data-viz-height]').getAttribute('data-viz-height');
  assert.equal(svg.getAttribute('viewBox'), `0 0 800 ${height}`);
  for (const view of svg.querySelectorAll('[data-viz-view]')) {
    const positions = [...view.querySelectorAll('[data-viz-legend]')].map(g => g.getAttribute('transform').split(',')[1]);
    assert.equal(positions.length, 3);
    assert.equal(new Set(positions).size, 1);
    assert.equal(view.querySelectorAll('[data-viz-zone]').length, 2);
  }
  const md = readFileSync(`${root}/blog/viz-typography-fixture/index.md`, 'utf8');
  assert.match(md, /Method with a longer label/);
  assert.doesNotMatch(md, /data-viz-height|<svg/);
});

test('tooltip inherits a light blog host and clears that override on theme-aware pages', () => {
  const figure = '<figure data-viz><svg><rect data-viz-zone data-viz-key="a" data-viz-title="Example" data-viz-rows="[]" tabindex="0" /></svg></figure>';
  const dom = new JSDOM(`<section class="qdrant-blog-post">${figure}</section><main>${figure}</main>`, { runScripts: 'outside-only' });
  dom.window.eval(readFileSync('themes/qdrant-2024/assets/js/viz.js', 'utf8'));
  const zones = dom.window.document.querySelectorAll('[data-viz-zone]');
  const tip = dom.window.document.querySelector('.viz-tip');
  zones[0].dispatchEvent(new dom.window.Event('focus'));
  assert.equal(tip.getAttribute('data-viz-theme'), 'light');
  zones[1].dispatchEvent(new dom.window.Event('focus'));
  assert.equal(tip.hasAttribute('data-viz-theme'), false);
  dom.window.close();
});

// Golden hashes protect default charts and the legacy typography preset.
// Changing one requires an explicit compatibility decision, not regeneration.
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('generation preserves default chart kinds and the legacy readable preset', () => {
  const expected = {
    "fixtures/readable": "4b16e40ff6a1d4003a4f41dfaacb528029b7ec02e93bacd1744c52ccd8035143",
    "oversampling/recall": "da2ca3d7c1482d23582308e448ff82e75bb6b167966331a1b8460e37fbfeae68",
    "defrag/rps": "2a7aef9eee6a0394487ede104c45b645ab793b8c98fb1db5076b4659c4873dfc"
};
  const dir = mkdtempSync(join(tmpdir(), 'viz-compatibility-'));
  try {
    mkdirSync(join(dir, 'data'));
    writeFileSync(join(dir, 'data/viz.json'), readFileSync('data/viz.json'));
    for (const id of Object.keys(expected)) {
      for (const ext of ['json', 'csv']) {
        const path = `assets/viz/${id}.${ext}`;
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), readFileSync(path));
      }
    }
    execFileSync(process.execPath, [resolve('scripts/viz/generate-charts.mjs')], { cwd: dir, stdio: 'pipe' });
    for (const [id, hash] of Object.entries(expected)) {
      assert.equal(createHash('sha256').update(readFileSync(join(dir, `assets/viz/${id}.svg`))).digest('hex'), hash, id);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
