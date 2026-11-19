import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('./index.js', import.meta.url));
const { SENTENCES, WORD_CAPS, sentenceChunks, mount } = await import(`data:text/javascript;base64,${source.toString('base64')}`);

test('sentence grouping retains every complete source sentence once and in order', () => {
  for (const group of [false, true]) for (const cap of WORD_CAPS) {
    const chunks = sentenceChunks(SENTENCES, { group, cap });
    assert.deepEqual(chunks.flatMap(chunk => chunk.sentences), SENTENCES);
    assert.equal(chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0), 23);
    for (const chunk of chunks) {
      if (!group) assert.equal(chunk.sentences.length, 1);
      if (chunk.oversized) {
        assert.equal(chunk.sentences.length, 1);
        assert.ok(chunk.wordCount > cap);
      } else assert.ok(chunk.wordCount <= cap);
      chunk.sentences.forEach(sentence => assert.ok(SENTENCES.includes(sentence), 'source sentence identity and wording survive'));
    }
  }
  assert.deepEqual(sentenceChunks(SENTENCES, { group: true, cap: 20 }).map(chunk => chunk.sentences.map(sentence => sentence.id)), [['S1', 'S2'], ['S3']]);
  assert.deepEqual(sentenceChunks(SENTENCES, { group: true, cap: 12 }).map(chunk => chunk.sentences.map(sentence => sentence.id)), [['S1'], ['S2'], ['S3']]);
  const small = sentenceChunks(SENTENCES, { group: true, cap: 8 });
  assert.deepEqual(small.map(chunk => chunk.oversized), [false, true, false]);
  assert.equal(small[1].sentences[0].text, SENTENCES[1].text, 'oversized sentences must not be silently truncated');
  assert.deepEqual(sentenceChunks([], { group: true, cap: 8 }), []);
  assert.throws(() => sentenceChunks(SENTENCES, { cap: 0 }), RangeError);
});

test('sentence controls expose grouping and oversized states, retain focus, and reset independently', t => {
  const dom = new JSDOM('<main><section id="first"></section><section id="second"></section></main>');
  const previous = globalThis.CustomEvent;
  globalThis.CustomEvent = dom.window.CustomEvent;
  t.after(() => {
    if (previous === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = previous;
    dom.window.close();
  });
  const { document } = dom.window;
  const [first, second] = [...document.querySelectorAll('section')];
  const ready = [];
  document.addEventListener('island:ready', event => ready.push(event.target));
  mount(first);
  mount(second);
  assert.deepEqual(ready, [first, second]);
  const status = node => node.querySelector('[role="status"]').textContent;
  const initial = status(first);
  assert.match(initial, /3 chunks, one per sentence/);
  assert.equal(first.querySelector('[role="status"]').getAttribute('aria-live'), 'polite');
  assert.equal(first.querySelector('[role="status"]').getAttribute('aria-atomic'), 'true');
  for (const button of first.querySelectorAll('button')) {
    assert.equal(button.type, 'button');
    assert.ok(button.tabIndex >= 0);
    assert.ok(button.textContent.trim());
  }

  first.querySelector('[data-mode="group"]').click();
  assert.match(status(first), /20-word cap: 2 chunks/);
  assert.match(status(first), /S1 and S2 now share a chunk/);
  for (const cap of WORD_CAPS) {
    const control = first.querySelector(`[data-cap="${cap}"]`);
    control.focus();
    control.click();
    assert.equal(document.activeElement, control);
    assert.equal(control.getAttribute('aria-pressed'), 'true');
    assert.equal(first.querySelector('[data-mode="group"]').getAttribute('aria-pressed'), 'true');
    assert.deepEqual([...first.querySelectorAll('[data-chunks] .qi-chunk__token')].map(token => token.textContent), ['S1', 'S2', 'S3']);
    assert.equal(first.querySelectorAll('[data-chunks] .is-oversized').length, cap === 8 ? 1 : 0);
    assert.match(status(first), new RegExp(`${cap}-word cap`));
    if (cap === 8) assert.match(status(first), /no text is discarded/);
    assert.equal(status(second), initial);
  }
  first.querySelector('[data-reset]').click();
  assert.equal(status(first), initial);
  assert.equal(first.querySelector('[data-mode="single"]').getAttribute('aria-pressed'), 'true');
  assert.equal(first.querySelectorAll('[data-cap][aria-pressed="true"]').length, 0);
  assert.equal(first.querySelectorAll('[data-chunks] .is-oversized').length, 0);
});
