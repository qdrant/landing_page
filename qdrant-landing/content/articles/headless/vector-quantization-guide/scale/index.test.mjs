import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('./index.js', import.meta.url), 'utf8');
const { mount } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('visible control labels match accessible groups and each group updates the figure', () => {
  const dom = new JSDOM('<div id="diagram"></div>');
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = dom.window.CustomEvent;
  try {
    const node = dom.window.document.querySelector('#diagram');
    mount(node);
    assert.deepEqual([...node.querySelectorAll('.qscale__control-label')].map(label => label.textContent), [
      'Embedding dimensions', 'Number of vectors', 'Available RAM',
    ]);
    for (const control of node.querySelectorAll('.qscale__control')) {
      assert.equal(control.querySelector('[role="group"]').getAttribute('aria-label'), control.querySelector('span').textContent);
    }
    for (const selector of ['[data-dims="384"]', '[data-count="1000000"]', '[data-ram="16000000000"]']) {
      const before = node.querySelector('[role="status"]').textContent;
      const button = node.querySelector(selector);
      button.click();
      assert.equal(button.getAttribute('aria-pressed'), 'true');
      assert.notEqual(node.querySelector('[role="status"]').textContent, before);
      assert.ok(node.querySelector('svg').getAttribute('aria-label').includes(node.querySelector('[role="status"]').textContent));
    }
  } finally {
    globalThis.CustomEvent = previousCustomEvent;
    dom.window.close();
  }
});
