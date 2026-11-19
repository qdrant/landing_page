import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('./index.js', import.meta.url));
const { SENTENCES, WINDOW_SIZE, sentenceWindows, mount } = await import(`data:text/javascript;base64,${source.toString('base64')}`);

test('sliding sentence windows preserve source identity, coverage, and the configured stride', () => {
  const expected = new Map([
    [3, [[0, 3], [3, 6]]],
    [2, [[0, 3], [2, 5], [4, 6]]],
    [1, [[0, 3], [1, 4], [2, 5], [3, 6]]],
  ]);
  const repeatCounts = new Map([[3, 0], [2, 2], [1, 6]]);
  for (const [stride, spans] of expected) {
    const chunks = sentenceWindows(SENTENCES, WINDOW_SIZE, stride);
    assert.deepEqual(chunks.map(({start, end}) => [start, end]), spans);
    const coverage = new Set();
    chunks.forEach((chunk, index) => {
      assert.equal(chunk.start, index * stride);
      assert.ok(chunk.sentences.length > 0 && chunk.sentences.length <= WINDOW_SIZE);
      chunk.sentences.forEach((sentence, offset) => {
        assert.equal(sentence, SENTENCES[chunk.start + offset]);
        coverage.add(sentence.id);
      });
      if (index) assert.equal(chunks[index - 1].end - chunk.start, WINDOW_SIZE - stride);
    });
    assert.deepEqual([...coverage], SENTENCES.map(sentence => sentence.id));
    assert.equal(chunks.reduce((count, chunk) => count + chunk.sentences.length, 0) - SENTENCES.length, repeatCounts.get(stride));
    const hasDependencyTogether = chunks.some(chunk => chunk.sentences.includes(SENTENCES[2]) && chunk.sentences.includes(SENTENCES[3]));
    assert.equal(hasDependencyTogether, stride < WINDOW_SIZE);
  }
  assert.deepEqual(sentenceWindows([], 3, 2), []);
  assert.equal(sentenceWindows(SENTENCES.slice(0, 2), 3, 1).length, 1, 'do not emit redundant windows after reaching the end');
  assert.equal(sentenceWindows(SENTENCES.slice(0, 3), 3, 1).length, 1);
  for (const [size, stride] of [[0, 1], [3, 0], [3, -1], [3, 4], [2.5, 1], [3, 1.5]]) {
    assert.throws(() => sentenceWindows(SENTENCES, size, stride), RangeError);
  }
});

test('stride, source highlighting, overlap, and reset remain accessible and independent', t => {
  const dom = new JSDOM('<main><section></section><section></section></main>');
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = dom.window.CustomEvent;
  t.after(() => {
    if (previousCustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = previousCustomEvent;
    dom.window.close();
  });
  const { document } = dom.window;
  const [first, second] = document.querySelectorAll('section');
  const ready = [];
  document.addEventListener('island:ready', event => ready.push(event.target));
  mount(first);
  mount(second);
  assert.deepEqual(ready, [first, second]);
  const status = node => node.querySelector('[role="status"]').textContent;
  const initial = status(first);
  assert.match(initial, /split across chunks/);
  assert.equal(first.querySelector('[role="status"]').getAttribute('aria-live'), 'polite');
  assert.equal(first.querySelector('[role="status"]').getAttribute('aria-atomic'), 'true');

  for (const stride of [2, 1, 3]) {
    first.querySelector(`[data-stride="${stride}"]`).click();
    assert.equal(first.querySelector('[data-stride][aria-pressed="true"]').dataset.stride, String(stride));
    assert.equal(first.querySelector('[data-chunk][aria-pressed="true"]').dataset.chunk, '0');
    const chunks = sentenceWindows(SENTENCES, WINDOW_SIZE, stride);
    assert.equal(first.querySelectorAll('[data-chunk]').length, chunks.length);
    const lastButton = first.querySelector(`[data-chunk="${chunks.length - 1}"]`);
    lastButton.focus();
    lastButton.click();
    assert.equal(document.activeElement, first.querySelector('[data-chunk][aria-pressed="true"]'));
    const last = chunks.at(-1);
    assert.deepEqual([...first.querySelectorAll('[data-source] .is-selected')].map(node => node.dataset.sentence), last.sentences.map(sentence => sentence.id));
    assert.deepEqual([...first.querySelectorAll('[data-selected-sentence]')].map(node => node.dataset.selectedSentence), last.sentences.map(sentence => sentence.id));
    assert.equal(first.querySelectorAll('[data-selected] .is-overlap').length, WINDOW_SIZE - stride);
    assert.match(status(first), stride === 3 ? /split across chunks/ : /stay together in/);
    assert.equal(status(second), initial);
    for (const button of first.querySelectorAll('button')) {
      assert.equal(button.type, 'button');
      assert.ok(button.tabIndex >= 0);
      if (button.hasAttribute('aria-pressed')) assert.ok(['true', 'false'].includes(button.getAttribute('aria-pressed')));
    }
  }
  first.querySelector('[data-stride="1"]').click();
  first.querySelector('[data-reset]').click();
  assert.equal(status(first), initial);
  assert.equal(first.querySelector('[data-stride][aria-pressed="true"]').dataset.stride, '3');
  assert.equal(first.querySelector('[data-chunk][aria-pressed="true"]').dataset.chunk, '0');
});
