import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

function generate(patch, csv = readFileSync('assets/viz/fixtures/stacked.csv')) {
  const dir = mkdtempSync(join(tmpdir(), 'viz-stacked-'));
  try {
    mkdirSync(join(dir, 'assets/viz'), { recursive: true });
    mkdirSync(join(dir, 'data'));
    writeFileSync(join(dir, 'data/viz.json'), readFileSync('data/viz.json'));
    writeFileSync(join(dir, 'assets/viz/example.csv'), csv);
    const spec = { ...JSON.parse(readFileSync('assets/viz/fixtures/stacked.json', 'utf8')), ...patch };
    writeFileSync(join(dir, 'assets/viz/example.json'), JSON.stringify(spec));
    execFileSync(process.execPath, [resolve('scripts/viz/generate-charts.mjs')], { cwd: dir, stdio: 'pipe' });
    return readFileSync(join(dir, 'assets/viz/example.svg'), 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('stacked columns draw one bar per group whose segment heights follow the data', () => {
  const doc = new JSDOM(`<svg>${generate({})}</svg>`).window.document;
  const bars = [...doc.querySelectorAll('[aria-label="bar"] rect')];
  assert.equal(bars.length, 6);
  // 400 px chart, 10 units: every segment height must be proportional to its value.
  const heights = bars.map((b) => Number(b.getAttribute('height')));
  const perUnit = heights[0] / 2;
  [2, 6, 5, 3, 1, 4].forEach((v, i) => assert.ok(Math.abs(heights[i] - v * perUnit) < 0.5, `segment ${i}`));
  // Segments of one group share an x range, so they stack rather than sit side by side.
  assert.equal(bars[0].getAttribute('x'), bars[1].getAttribute('x'));
  assert.match(doc.body.textContent, /8\.0 u/);
});

test('stackTotals is opt-in', () => {
  const svg = generate({ stackTotals: undefined });
  assert.doesNotMatch(svg, /8\.0 u/);
});

test('a stack above yMax or an invalid option fails generation', () => {
  assert.throws(() => generate({ yMax: 7 }), (e) => /above yMax/.test(String(e.stderr)));
  assert.throws(() => generate({ stacked: 'yes' }), (e) => /stacked must be true/.test(String(e.stderr)));
  assert.throws(() => generate({ kind: 'lines-facet' }), (e) => /stacked must be true/.test(String(e.stderr)));
  assert.throws(() => generate({ stacked: undefined, stackTotals: true }), (e) => /requires stacked/.test(String(e.stderr)));
});
