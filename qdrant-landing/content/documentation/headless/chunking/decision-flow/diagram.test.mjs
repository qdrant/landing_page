import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('./index.js', import.meta.url));
const { mount } = await import(`data:text/javascript;base64,${source.toString('base64')}`);

const CHECKLIST_LABELS = [
  ['Audit Sources', 'Map Natural Anchors'],
  ['Align With Structure', 'Set Limits & Preserve Context'],
  ['Use Lightweight Cues', 'Reuse & Scale Processing'],
  ['Check Boundaries & Limits', 'Benchmark & Diagnose'],
];

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

test('each title selects a bullet-only checklist without replacing the focused control', t => {
  const document = fixture(t);
  const node = document.querySelector('#first');
  mount(node);
  const buttons = [...node.querySelectorAll('button')];
  assert.deepEqual(buttons.map(button => button.textContent.trim()), [
    'Inspect sources', 'Choose boundary', 'Speed up chunking', 'Evaluate chunk quality',
  ]);
  assert.equal(node.querySelectorAll('.qi-flow__arrow').length, 3);
  assert.equal(node.querySelectorAll('a, [data-choices], [data-reset], [data-next]').length, 0);
  const panel = node.querySelector('.qi-flow__detail');
  const checklists = new Set();
  for (const button of [...buttons, buttons[0], buttons[0]]) {
    button.focus();
    button.querySelector('b').click();
    assert.equal(document.activeElement, button);
    assert.equal(node.querySelectorAll('[aria-pressed="true"]').length, 1);
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.equal(node.querySelector('.qi-flow__detail'), panel);
    assert.equal(panel.children.length, 1);
    assert.equal(panel.firstElementChild.tagName, 'UL');
    const items = [...panel.querySelectorAll('li')];
    assert.equal(items.length, 2);
    assert.deepEqual(items.map(item => item.firstElementChild.tagName), ['STRONG', 'STRONG']);
    assert.deepEqual(items.map(item => item.firstElementChild.textContent),
      CHECKLIST_LABELS[Number(button.dataset.step) - 1].map(label => `${label}:`));
    assert.equal(panel.querySelectorAll('input, button, p, h1, h2, h3').length, 0);
    assert.equal(panel.firstElementChild.getAttribute('aria-label'), `Checklist: ${button.textContent.trim()}`);
    assert.ok(node.querySelector('[role="status"]').textContent.startsWith(button.textContent.trim()));
    assert.doesNotMatch(node.querySelector('[role="status"]').textContent, /\*\*/);
    checklists.add(panel.textContent);
  }
  assert.equal(checklists.size, 4);
  node.querySelector('[data-step="4"]').click();
  assert.deepEqual([...panel.querySelectorAll('li')[1].querySelectorAll('strong')].map(item => item.textContent), [
    'Benchmark & Diagnose:', 'Recall@K', 'MRR',
  ]);
  assert.doesNotMatch(node.textContent, /Explore the five decisions|Select a step|Next Action|Situation:|Receipt totals/);
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
  first.querySelector('[data-step="4"]').click();
  assert.match(first.querySelector('[data-checklist]').textContent, /Benchmark & Diagnose/);
  assert.equal(second.innerHTML, initialSecond);
  first.querySelector('.qi-flow__checklist li').click();
  assert.equal(first.querySelector('[data-step="4"]').getAttribute('aria-pressed'), 'true');
});
