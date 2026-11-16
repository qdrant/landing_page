import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { mount } from './index.js';

test('precision changes the query and winner, never stored page signs', () => {
  const dom = new JSDOM('<div></div><div></div>');
  globalThis.CustomEvent = dom.window.CustomEvent;
  const [a, b] = dom.window.document.querySelectorAll('div');
  let ready = 0;
  a.addEventListener('island:ready', () => ready++);
  mount(a);
  mount(b);
  const heights = root => [...root.querySelectorAll('[data-bar]')].map(el => el.style.height);
  const pages = [...a.querySelectorAll('[data-page]')].map(el => el.textContent);
  const status = root => root.querySelector('[role="status"]').textContent;
  assert.equal(ready, 1);
  assert.equal(a.querySelectorAll('[role="group"]').length, 1);
  assert.deepEqual(heights(a), ['100%', '80%', '1%', '1%', '1%', '1%', '1%', '1%']);
  assert.match(status(a), /Page A wins: two strong matches outweigh six weak ones/);
  assert.deepEqual([...a.querySelectorAll('[data-page]')].map(row => row.querySelectorAll('.ce5-asymmetric__sign--match').length), [2, 6]);
  assert.deepEqual(pages.map(s => s.replace(/\s/g, '')), ['PageA++−−−−−−', 'PageB−−++++++']);
  for (const bits of ['1', '8', '1']) {
    a.querySelector(`[data-query="${bits}"]`).click();
    assert.equal(a.querySelectorAll('[aria-pressed="true"]').length, 1);
    assert.equal(a.querySelector('[aria-pressed="true"]').dataset.query, bits);
    assert.deepEqual([...a.querySelectorAll('[data-page]')].map(el => el.textContent), pages);
    assert.match(status(a), bits === '1' ? /Page B wins/ : /Page A wins/);
    assert.equal(new Set(heights(a)).size, bits === '1' ? 1 : 3);
    assert.equal(a.querySelector('[data-winner="true"]').dataset.page, bits === '1' ? 'B' : 'A');
  }
  assert.match(status(b), /Page A wins/);
  assert.doesNotMatch(a.textContent, /nDCG|%|174|100/);
  dom.window.close();
});

test('SVG fallback preserves both outcomes without JavaScript', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../../../../static/blog/cohere-embed-5-qdrant/asymmetric.svg', import.meta.url), 'utf8');
  const dom = new JSDOM(source, { contentType: 'image/svg+xml' });
  const svg = dom.window.document.documentElement;
  assert.equal(svg.localName, 'svg');
  assert.match(svg.textContent, /Illustrative values/);
  assert.match(svg.textContent, /1-bit query.*Page B wins.*8-bit query.*Page A wins/is);
  const palette = JSON.parse(await readFile(new URL('../../../../data/viz.json', import.meta.url), 'utf8')).palette;
  const winners = [...svg.querySelectorAll('rect[stroke-width="2"]')];
  assert.equal(winners.length, 2);
  for (const winner of winners) {
    assert.equal(winner.getAttribute('stroke'), palette.categorical[0]);
    assert.equal(winner.getAttribute('fill'), 'none');
  }
  const bars = [...svg.querySelectorAll('rect[width="14"]')];
  assert.equal(bars.length, 16);
  assert.ok(bars.every(bar => bar.getAttribute('fill') === palette.categorical[0]));
  assert.equal(svg.querySelectorAll('script, foreignObject').length, 0);
  dom.window.close();
});
