import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

// These island sources are bundled by Hugo and do not use package-level ESM.
async function loadIsland(name) {
  const source = await readFile(new URL(`./${name}/index.js`, import.meta.url));
  return import(`data:text/javascript;base64,${source.toString('base64')}`);
}

const [fixed, recursive, semantic, agentic] = await Promise.all(
  ['fixed', 'recursive', 'semantic', 'agentic'].map(loadIsland),
);

function assertOrderedCoverage(units, words) {
  assert.deepEqual(units.flatMap((unit) => unit.words), words);
  let cursor = 0;
  for (const unit of units) {
    assert.equal(unit.start, cursor);
    assert.equal(unit.end, cursor + unit.words.length);
    assert.deepEqual(unit.words, words.slice(unit.start, unit.end));
    cursor = unit.end;
  }
  assert.equal(cursor, words.length);
}

test('fixed windows cover the source with the configured stride and overlap', () => {
  for (const size of [8, 12, 16]) {
    for (const overlap of [0, 3, 6]) {
      const chunks = fixed.chunkWords(fixed.SOURCE_WORDS, size, overlap);
      const coverage = new Set();
      chunks.forEach((chunk, index) => {
        assert.equal(chunk.start, index * (size - overlap));
        assert.ok(chunk.words.length > 0 && chunk.words.length <= size);
        assert.deepEqual(chunk.words, fixed.SOURCE_WORDS.slice(chunk.start, chunk.end));
        if (index > 0) {
          assert.equal(chunks[index - 1].end - chunk.start, overlap);
          assert.deepEqual(chunk.words.slice(0, overlap), overlap ? chunks[index - 1].words.slice(-overlap) : []);
        }
        for (let i = chunk.start; i < chunk.end; i++) coverage.add(i);
      });
      assert.equal(coverage.size, fixed.SOURCE_WORDS.length);
      assert.equal(chunks.at(-1).end, fixed.SOURCE_WORDS.length);
      assert.equal(chunks.reduce((total, chunk) => total + chunk.words.length, 0) - coverage.size, (chunks.length - 1) * overlap);
    }
  }
  assert.deepEqual(fixed.chunkWords([], 12, 0), []);
  assert.throws(() => fixed.chunkWords(['word'], 8, 8), RangeError);
});

test('recursive stages split only oversized units and preserve source order through packing', () => {
  const expectedSizes = new Map([[12, [12, 12, 12, 11]], [24, [20, 22, 5]], [36, [12, 35]]]);
  for (const [cap, sizes] of expectedSizes) {
    const stages = recursive.recursiveStages(cap);
    for (const units of Object.values(stages)) assertOrderedCoverage(units, recursive.SOURCE_WORDS);
    for (const [before, after] of [[stages.paragraphs, stages.sentences], [stages.sentences, stages.words]]) {
      for (const unit of before) {
        if (unit.words.length <= cap) {
          assert.ok(after.includes(unit), `${unit.id} should retain its identity at cap ${cap}`);
        } else {
          assert.ok(!after.includes(unit));
          const children = after.filter((child) => child.parent === unit.id);
          assert.deepEqual(children.flatMap((child) => child.words), unit.words);
        }
      }
    }
    assert.ok(stages.words.every((unit) => unit.words.length <= cap));
    assert.ok(stages.chunks.every((chunk) => chunk.words.length <= cap));
    assert.deepEqual(stages.chunks.map((chunk) => chunk.words.length), sizes);
    const packedUnits = stages.chunks.flatMap((chunk) => chunk.units);
    assert.equal(packedUnits.length, stages.words.length);
    packedUnits.forEach((unit, index) => assert.equal(unit, stages.words[index]));
  }
  assert.throws(() => recursive.recursiveStages(0), RangeError);
});

test('semantic thresholds yield two, three, or five groups and keep equality together', () => {
  for (const [threshold, count] of [[0.35, 2], [0.65, 3], [0.85, 5]]) {
    const groups = semantic.groupBySimilarity(semantic.SENTENCES, semantic.SIMILARITIES, threshold);
    assert.equal(groups.length, count);
    assert.deepEqual(groups.flat(), semantic.SENTENCES);
  }
  for (let index = 0; index < semantic.SIMILARITIES.length; index++) {
    const score = semantic.SIMILARITIES[index];
    const equal = semantic.groupBySimilarity(semantic.SENTENCES, semantic.SIMILARITIES, score);
    assert.ok(equal.some((group) => group.includes(semantic.SENTENCES[index]) && group.includes(semantic.SENTENCES[index + 1])));
    const higher = semantic.groupBySimilarity(semantic.SENTENCES, semantic.SIMILARITIES, score + 0.001);
    assert.ok(!higher.some((group) => group.includes(semantic.SENTENCES[index]) && group.includes(semantic.SENTENCES[index + 1])));
  }
  assert.deepEqual(semantic.groupBySimilarity([], [], 0.65), []);
  assert.throws(() => semantic.groupBySimilarity(semantic.SENTENCES, [], 0.65));
});

test('agentic decisions identify exact source slices without rewriting', () => {
  const source = agentic.SENTENCES.map((sentence) => sentence.text).join(' ');
  for (const windowEnd of [2, 4]) {
    const decision = agentic.exampleDecision(windowEnd);
    assert.deepEqual(decision.sentences, agentic.SENTENCES.slice(0, windowEnd));
    assert.equal(decision.splitAfter, `S${windowEnd}`);
    assert.equal(decision.text, source.slice(0, decision.characterPosition));
    assert.equal(decision.text, agentic.SENTENCES.slice(0, windowEnd).map((sentence) => sentence.text).join(' '));
    assert.ok(!decision.text.includes(agentic.SENTENCES[windowEnd].text));
  }
  assert.throws(() => agentic.exampleDecision(5));
});

function mountedPair(t, island) {
  const dom = new JSDOM('<main><section id="first"></section><section id="second"></section></main>');
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = dom.window.CustomEvent;
  t.after(() => {
    if (previousCustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = previousCustomEvent;
    dom.window.close();
  });
  const { document } = dom.window;
  const nodes = [document.querySelector('#first'), document.querySelector('#second')];
  const ready = [];
  document.addEventListener('island:ready', (event) => ready.push(event.target));
  nodes.forEach((node) => island.mount(node));
  assert.deepEqual(ready, nodes, 'each mounted island emits one bubbling ready event');
  for (const node of nodes) {
    const status = node.querySelector('[role="status"]');
    assert.ok(status.textContent.trim());
    assert.equal(status.getAttribute('aria-live'), 'polite');
    assert.equal(status.getAttribute('aria-atomic'), 'true');
    assert.ok(node.querySelectorAll('button').length > 0);
    for (const button of node.querySelectorAll('button')) {
      assert.equal(button.type, 'button');
      assert.ok(button.tabIndex >= 0);
      assert.ok(button.textContent.trim() || button.getAttribute('aria-label'));
      if (button.hasAttribute('aria-pressed')) assert.ok(['true', 'false'].includes(button.getAttribute('aria-pressed')));
    }
  }
  return { document, first: nodes[0], second: nodes[1] };
}

const statusText = (node) => node.querySelector('[role="status"]').textContent;
const pressed = (node, selector) => node.querySelector(`${selector}[aria-pressed="true"]`);
const click = (node, selector) => {
  const button = node.querySelector(selector);
  assert.ok(button, `control ${selector} exists`);
  assert.equal(button.tagName, 'BUTTON');
  button.click();
};

test('fixed controls update one instance, retain focused range selection, and reset', (t) => {
  const { document, first, second } = mountedPair(t, fixed);
  const initial = statusText(first);
  for (const size of [8, 12, 16]) for (const overlap of [0, 3, 6]) {
    click(first, `[data-size="${size}"]`);
    click(first, `[data-overlap="${overlap}"]`);
    assert.equal(pressed(first, '[data-size]').dataset.size, String(size));
    assert.equal(pressed(first, '[data-overlap]').dataset.overlap, String(overlap));
    const chunks = fixed.chunkWords(fixed.SOURCE_WORDS, size, overlap);
    assert.equal(first.querySelectorAll('[data-chunk]').length, chunks.length);
    const last = first.querySelector(`[data-chunk="${chunks.length - 1}"]`);
    last.focus();
    last.click();
    assert.equal(document.activeElement, pressed(first, '[data-chunk]'));
    assert.equal(document.activeElement.dataset.chunk, String(chunks.length - 1));
    assert.equal(first.querySelectorAll('.qi-chunk__source-words [data-word]').length, fixed.SOURCE_WORDS.length);
    assert.equal(first.querySelectorAll('.qi-chunk__source-words .is-selected').length, chunks.at(-1).words.length);
    assert.equal(first.querySelectorAll('.qi-chunk__source-words .is-overlap').length, overlap);
    assert.equal(statusText(second), initial);
    assert.equal(pressed(second, '[data-size]').dataset.size, '12');
  }
  // Changing parameters after selecting the last range returns to the first range.
  click(first, '[data-size="8"]');
  assert.equal(pressed(first, '[data-chunk]').dataset.chunk, '0');
  click(first, '[data-reset]');
  assert.equal(statusText(first), initial);
  assert.equal(pressed(first, '[data-overlap]').dataset.overlap, '0');
});

test('recursive controls advance all stages independently and reset the cap', (t) => {
  const { first, second } = mountedPair(t, recursive);
  const initial = statusText(first);
  for (const cap of [12, 24, 36]) {
    click(first, `[data-cap="${cap}"]`);
    assert.equal(pressed(first, '[data-cap]').dataset.cap, String(cap));
    for (let step = 0; step < 4; step++) {
      assert.equal(first.querySelector('[aria-current="step"]').dataset.step, String(step));
      assert.equal(first.querySelector('[data-next]').disabled, step === 3);
      assert.equal(statusText(second), initial);
      if (step < 3) click(first, '[data-next]');
    }
    assert.equal(first.querySelectorAll('.qi-chunk__units .qi-chunk__chunk').length, recursive.recursiveStages(cap).chunks.length);
    assert.match(statusText(first), /47 source words/);
  }
  click(first, '[data-reset]');
  assert.equal(statusText(first), initial);
  assert.equal(pressed(first, '[data-cap]').dataset.cap, '12');
  assert.equal(first.querySelector('[data-next]').disabled, false);
});

test('semantic threshold controls update grouping independently and reset', (t) => {
  const { first, second } = mountedPair(t, semantic);
  const initial = statusText(first);
  for (const [threshold, count] of [[0.35, 2], [0.65, 3], [0.85, 5]]) {
    click(first, `[data-threshold="${threshold}"]`);
    assert.equal(pressed(first, '[data-threshold]').dataset.threshold, String(threshold));
    assert.equal(first.querySelectorAll('[data-chunks] [data-chunk]').length, count);
    assert.deepEqual([...first.querySelectorAll('[data-chunks] .qi-chunk__token')].map((token) => token.textContent), semantic.SENTENCES.map((sentence) => sentence.id));
    assert.match(statusText(first), new RegExp(`${count} chunks`));
    assert.equal(statusText(second), initial);
    assert.equal(pressed(second, '[data-threshold]').dataset.threshold, '0.65');
  }
  click(first, '[data-reset]');
  assert.equal(statusText(first), initial);
  assert.equal(pressed(first, '[data-threshold]').dataset.threshold, '0.65');
});

test('agentic controls reveal exact slices, clear stale decisions, and reset independently', (t) => {
  const { first, second } = mountedPair(t, agentic);
  const initial = statusText(first);
  for (const windowEnd of [2, 4]) {
    click(first, `[data-window="${windowEnd}"]`);
    assert.equal(pressed(first, '[data-window]').dataset.window, String(windowEnd));
    assert.equal(first.querySelector('[data-reveal]').getAttribute('aria-expanded'), 'false');
    assert.equal(first.querySelector('[data-output]'), null);
    assert.equal(first.querySelectorAll('.is-in-window').length, windowEnd);
    click(first, '[data-reveal]');
    assert.equal(first.querySelector('[data-reveal]').getAttribute('aria-expanded'), 'true');
    assert.equal(first.querySelector('[data-output] .qi-chunk__text').textContent, agentic.exampleDecision(windowEnd).text);
    assert.match(statusText(first), new RegExp(`split after S${windowEnd}`));
    assert.equal(statusText(second), initial);
    assert.equal(second.querySelector('[data-output]'), null);
  }
  click(first, '[data-reveal]');
  assert.equal(first.querySelector('[data-output]'), null);
  click(first, '[data-reveal]');
  click(first, '[data-reset]');
  assert.equal(statusText(first), initial);
  assert.equal(pressed(first, '[data-window]').dataset.window, '2');
  assert.equal(first.querySelector('[data-reveal]').getAttribute('aria-expanded'), 'false');
  assert.equal(first.querySelector('[data-output]'), null);
});
