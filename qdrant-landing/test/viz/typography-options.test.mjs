import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { csvParse } from 'd3-dsv';
import { join } from 'node:path';
import { buildSite } from './helpers.mjs';
const fixture = ext => readFileSync(join(buildSite(), 'blog/viz-typography-fixture', `index.${ext}`), 'utf8');

test('opt-in chart dimensions preserve both data views and reserve the stacked legend', () => {
  const doc = new JSDOM(fixture('html')).window.document;
  const svg = doc.querySelector('[aria-labelledby="viz-cap-fixtures-readable"]');
  assert.equal(svg.getAttribute('viewBox'), '0 0 640 680');
  const spec = JSON.parse(readFileSync('assets/viz/fixtures/readable.json', 'utf8'));
  const rows = csvParse(readFileSync('assets/viz/fixtures/readable.csv', 'utf8'));
  const views = [...svg.querySelectorAll('[data-viz-view]')];
  assert.equal(views.length, 2);
  for (const [i, view] of views.entries()) {
    const actual = [...view.querySelectorAll('[data-viz-rows]')]
      .flatMap(zone => JSON.parse(zone.getAttribute('data-viz-rows')).map(row => Number(row.v)));
    assert.deepEqual(actual, rows.map(row => Number(row[spec.views[i].y])));
    const legend = [...view.querySelectorAll('g[transform]')].filter(g => g.querySelector('text')?.textContent.startsWith('Method'));
    assert.equal(legend.length, 3);
    for (const item of legend) {
      const [, y] = item.getAttribute('transform').match(/translate\([^,]+,([\d.]+)\)/);
      assert.ok(Number(y) + 22 < 680, 'legend must fit inside the outer viewBox');
    }
  }
  const markdown = fixture('md');
  assert.match(markdown, /\| p99 \| Method with a longer label \| 90 \| 9 \|/);
  assert.match(markdown, /Illustrative per-item times range from 2 to 9 ms/);
});

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('invalid opt-in geometry fails generation rather than shipping clipped layouts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'viz-invalid-'));
  try {
    mkdirSync(join(dir, 'assets/viz'), { recursive: true });
    mkdirSync(join(dir, 'data'));
    writeFileSync(join(dir, 'data/viz.json'), readFileSync('data/viz.json'));
    writeFileSync(join(dir, 'assets/viz/example.csv'), readFileSync('assets/viz/fixtures/readable.csv'));
    const source = JSON.parse(readFileSync('assets/viz/fixtures/readable.json', 'utf8'));
    const cases = [
      [{ width: 12.5 }, /width must be an integer/],
      [{ legendRoom: 30 }, /needs legendRoom/],
      [{ height: 200 }, /needs height/],
      [{ kind: 'lines-facet' }, /supported only for grouped-columns/],
      [{ views: [{ ...source.views[0], width: 400 }] }, /must be top-level/],
      [{ textScale: '1.4' }, /textScale must be a number/],
      [{ textScale: 0 }, /textScale must be a number/],
      [{ textScale: 3 }, /textScale must be a number/],
      [{ legendLayout: 'horizontal' }, /legendLayout must be/],
      [{ textScale: 1.4, views: [{ ...source.views[0], series: 'other' }] }, /must share/],
      [{ textScale: 1.4, views: [{ ...source.views[0], data: 'other.csv' }] }, /must share/],
      [{ views: [{ ...source.views[0], textScale: 1.4 }] }, /must be top-level/],
    ];
    for (const [patch, message] of cases) {
      writeFileSync(join(dir, 'assets/viz/example.json'), JSON.stringify({ ...source, ...patch }));
      assert.throws(() => execFileSync(process.execPath, [resolve('scripts/viz/generate-charts.mjs')], { cwd: dir, stdio: 'pipe' }), err => message.test(String(err.stderr)));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
