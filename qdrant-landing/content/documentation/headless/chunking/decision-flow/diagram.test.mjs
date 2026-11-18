import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('./index.js', import.meta.url));
const { mount } = await import(`data:text/javascript;base64,${source.toString('base64')}`);

function fixture(t) {
  const dom = new JSDOM('<main><section id="first"></section><section id="second"></section></main>');
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = dom.window.CustomEvent;
  t.after(() => {
    if (previousCustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = previousCustomEvent;
    dom.window.close();
  });
  return dom.window.document;
}

test('each title selects one concise example without replacing the focused control', t => {
  const document = fixture(t);
  const node = document.querySelector('#first');
  mount(node);
  const buttons = [...node.querySelectorAll('button')];
  assert.deepEqual(buttons.map(button => button.textContent.trim()), [
    'Inspect sources', 'Choose boundary', 'Set size and overlap',
    'Add missing context', 'Test final evidence',
  ]);
  assert.equal(node.querySelectorAll('.qi-flow__arrow').length, 4);
  assert.equal(node.querySelectorAll('a, [data-choices], [data-reset], [data-next]').length, 0);
  const panel = node.querySelector('.qi-flow__detail');
  const examples = new Set();
  for (const button of [...buttons, buttons[0], buttons[0]]) {
    button.focus();
    button.querySelector('b').click();
    assert.equal(document.activeElement, button);
    assert.equal(node.querySelectorAll('[aria-pressed="true"]').length, 1);
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.equal(node.querySelector('.qi-flow__detail'), panel);
    assert.equal(panel.querySelectorAll('.qi-flow__example').length, 1);
    assert.ok(panel.textContent.trim().split(/\s+/).length <= 35);
    assert.ok(node.querySelector('[role="status"]').textContent.startsWith(button.textContent.trim()));
    examples.add(panel.textContent);
  }
  assert.equal(examples.size, 5);
  assert.match(panel.textContent, /Total \$87/);
  assert.doesNotMatch(node.textContent, /Explore the five decisions|Select a step|Next Action|Situation:/);
});

test('mount announces readiness and selections remain scoped to their own diagram', t => {
  const document = fixture(t);
  const first = document.querySelector('#first');
  const second = document.querySelector('#second');
  const ready = [];
  document.addEventListener('island:ready', event => ready.push(event.target));
  mount(first);
  mount(second);
  assert.deepEqual(ready, [first, second]);
  const initialSecond = second.innerHTML;
  first.querySelector('[data-step="5"]').click();
  assert.match(first.querySelector('[data-after]').textContent, /Missing: Download linked files separately/);
  assert.equal(second.innerHTML, initialSecond);
  first.querySelector('.qi-flow__example').click();
  assert.equal(first.querySelector('[data-step="5"]').getAttribute('aria-pressed'), 'true');
});
