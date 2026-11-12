import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {csvParse} from 'd3-dsv';
const folder = 'content/documentation/headless/reranker/gain/';
const module = await import('data:text/javascript;base64,' + Buffer.from(readFileSync(folder + 'index.js')).toString('base64'));
test('selection, keyboard point values, reset, and independent mounts preserve every series', () => {
  const dom = new JSDOM('<div id="one"></div><div id="two"></div>');
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.ResizeObserver = class {observe() {}};
  const one = dom.window.document.querySelector('#one');
  const two = dom.window.document.querySelector('#two');
  module.mount(one); module.mount(two);
  assert.equal(one.querySelectorAll('[data-point]').length, 25);
  one.querySelector('[data-select="3"]').click();
  assert.equal(one.querySelector('[data-select="3"]').getAttribute('aria-pressed'), 'true');
  assert.match(one.querySelector('.qi-status').textContent, /CodeSearchNet: \+0.135025/);
  assert.equal(two.querySelectorAll('.rg-active').length, 0);
  const point = one.querySelector('[data-series="2"] [data-point="0"]');
  point.dispatchEvent(new dom.window.KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
  assert.match(one.querySelector('.qi-status').textContent, /WANDS: -0.033478.*10 candidates/);
  assert.equal(one.querySelectorAll('.rg-line').length, 5);
  one.querySelector('[data-reset]').click();
  assert.equal(one.querySelectorAll('.rg-active').length, 0);
});
test('fallback retains all datasets and logarithmic positions at desktop and narrow widths', async () => {
  const {drawing} = await import('./plot.mjs');
  const rows = csvParse(readFileSync(folder + 'data.csv', 'utf8'));
  const palette = JSON.parse(readFileSync('data/viz.json', 'utf8')).palette.categorical;
  const series = [...new Set(rows.map(row => row.dataset))].map((name, i) => ({name, color: palette[i], values: rows.filter(row => row.dataset === name).map(row => Number(row.best_gain))}));
  for (const width of [320,760]) {
    const dom = new JSDOM(drawing(series,width), {contentType:'image/svg+xml'});
    const points = [...dom.window.document.querySelector('[data-series="0"]').querySelectorAll('[data-point]')];
    const distances = points.slice(1).map((point,i) => Number(point.getAttribute('cx')) - Number(points[i].getAttribute('cx')));
    assert.ok(distances[0] > distances[1]);
    assert.ok(Math.abs(distances[1] - distances[2]) < 1e-9);
    assert.equal(dom.window.document.querySelectorAll('[data-series]').length,5);
  }
  const svg = readFileSync('static/documentation/reranker/gain.svg','utf8');
  const fallback = new JSDOM(svg,{contentType:'image/svg+xml'});
  assert.equal(fallback.window.document.querySelectorAll('[data-point]').length,25);
  assert.ok(svg.includes('DBPedia-entity'));
});
