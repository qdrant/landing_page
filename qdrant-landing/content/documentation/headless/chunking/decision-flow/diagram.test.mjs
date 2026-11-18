import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('./index.js', import.meta.url));
const { STEPS, decisionFor, mount } = await import(`data:text/javascript;base64,${source.toString('base64')}`);

test('decision routes distinguish evidence loss from answering failure', () => {
  assert.deepEqual(STEPS.map(step => step.id), [1, 2, 3, 4, 5]);
  assert.equal(decisionFor(1, 'missing').nextStep.id, 1);
  assert.equal(decisionFor(3, 'oversized').nextStep.id, 3);
  assert.equal(decisionFor(4, 'identity').nextStep.id, 3);
  assert.equal(decisionFor(4, 'condition').nextStep.id, 3);
  assert.equal(decisionFor(5, 'source').nextStep.id, 1);
  assert.equal(decisionFor(5, 'search').nextStep.id, 2);
  assert.equal(decisionFor(5, 'assembly').nextStep.id, 3);
  assert.equal(decisionFor(5, 'assembly').choice.link, '#4-add-context-where-needed');
  assert.equal(decisionFor(5, 'answer').nextStep, null);
  assert.equal(decisionFor(5, 'present').nextStep, null);
  for (const step of STEPS) for (const choice of step.choices) {
    assert.ok(choice.action.length > 0);
    assert.ok(choice.next === null || STEPS.some(candidate => candidate.id === choice.next));
  }
  assert.throws(() => decisionFor(9, 'missing'), RangeError);
  assert.throws(() => decisionFor(1, 'answer'), RangeError);
});

test('the map retains all five decisions and supports choices, returns, links, and independent reset', t => {
  const dom = new JSDOM('<main><section id="first"></section><section id="second"></section></main>');
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = dom.window.CustomEvent;
  t.after(() => {
    if (previousCustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = previousCustomEvent;
    dom.window.close();
  });
  const document = dom.window.document;
  const first = document.querySelector('#first');
  const second = document.querySelector('#second');
  const ready = [];
  document.addEventListener('island:ready', event => ready.push(event.target));
  mount(first);
  mount(second);
  assert.deepEqual(ready, [first, second]);
  const initialStatus = second.querySelector('[role="status"]').textContent;
  const initialAction = second.querySelector('[data-action]').textContent;
  for (const step of STEPS) {
    const stepButton = first.querySelector(`[data-step="${step.id}"]`);
    stepButton.focus();
    stepButton.click();
    assert.equal(document.activeElement, stepButton);
    assert.equal(first.querySelectorAll('[data-step]').length, 5);
    assert.equal(first.querySelectorAll('.qi-flow__arrow').length, 4);
    assert.equal(stepButton.getAttribute('aria-pressed'), 'true');
    assert.equal(first.querySelector('[data-section]').getAttribute('href'), step.anchor);
    for (const choice of step.choices) {
      const button = first.querySelector(`[data-choice="${choice.id}"]`);
      button.focus();
      button.click();
      assert.equal(document.activeElement, button);
      assert.equal(button.getAttribute('aria-pressed'), 'true');
      assert.equal(first.querySelector('[data-action]').textContent, choice.action);
      assert.equal(first.querySelector('[data-next]').hidden, choice.next === null || choice.next === step.id);
      assert.equal(first.querySelector('[data-related]').hidden, !choice.link);
      assert.match(first.querySelector('[role="status"]').textContent, new RegExp(`Step ${step.id}:`));
      assert.equal(second.querySelector('[role="status"]').textContent, initialStatus);
      assert.equal(second.querySelector('[data-action]').textContent, initialAction);
    }
  }
  first.querySelector('[data-choice="source"]').click();
  first.querySelector('[data-next]').click();
  assert.equal(first.querySelector('[data-step="1"]').getAttribute('aria-pressed'), 'true');
  assert.equal(document.activeElement, first.querySelector('[data-step="1"]'));
  assert.equal(first.querySelector('[data-choice="missing"]').getAttribute('aria-pressed'), 'true', 'returning to a decision retains its selected situation');
  first.querySelector('[data-reset]').click();
  assert.equal(first.querySelector('[role="status"]').textContent, initialStatus);
  assert.equal(first.querySelector('[data-choice="intact"]').getAttribute('aria-pressed'), 'true');
  first.querySelector('[data-next]').click();
  assert.equal(first.querySelector('[data-step="2"]').getAttribute('aria-pressed'), 'true');
  assert.equal(first.querySelector('[data-choice="complete"]').getAttribute('aria-pressed'), 'true');
});
