import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('./index.js', import.meta.url));
const { PARAGRAPHS, groupParagraphs, mount } = await import(`data:text/javascript;base64,${source.toString('base64')}`);

test('paragraph grouping retains each complete paragraph exactly once and respects sections', () => {
  assert.deepEqual(PARAGRAPHS.map((paragraph) => paragraph.wordCount), [10, 12, 15, 8]);
  for (const cap of [12, 24, 48]) for (const pack of [false, true]) {
    const groups = groupParagraphs(PARAGRAPHS, cap, pack);
    assert.deepEqual(groups.flatMap((group) => group.paragraphs), PARAGRAPHS);
    groups.forEach((group) => {
      assert.ok(group.paragraphs.every((paragraph) => paragraph.section === group.section));
      assert.equal(group.wordCount, group.paragraphs.reduce((sum, paragraph) => sum + paragraph.wordCount, 0));
      assert.equal(group.oversized, group.wordCount > cap);
      if (group.oversized) assert.equal(group.paragraphs.length, 1);
    });
    if (!pack) assert.ok(groups.every((group) => group.paragraphs.length === 1));
  }
  assert.deepEqual(groupParagraphs(PARAGRAPHS, 24, true).map((group) => group.paragraphs.map((paragraph) => paragraph.id)), [['P1', 'P2'], ['P3'], ['P4']]);
  assert.deepEqual(groupParagraphs(PARAGRAPHS, 48, true).map((group) => group.paragraphs.map((paragraph) => paragraph.id)), [['P1', 'P2', 'P3'], ['P4']]);
  assert.ok(PARAGRAPHS[2].wordCount + PARAGRAPHS[3].wordCount <= 24, 'the section boundary, not lack of capacity, keeps P3 and P4 apart');
});

test('oversized paragraphs are flagged intact rather than truncated or merged', () => {
  const groups = groupParagraphs(PARAGRAPHS, 12, true);
  const pending = groups.filter((group) => group.oversized);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].paragraphs[0], PARAGRAPHS[2]);
  assert.equal(pending[0].paragraphs[0].text, 'Linked files remain references in the archive. Download them separately before sharing a complete copy.');
  assert.deepEqual(groupParagraphs([], 24, true), []);
  for (const invalid of [0, -1, 1.5, Infinity]) assert.throws(() => groupParagraphs(PARAGRAPHS, invalid), RangeError);
});

test('paragraph controls update grouping, announce pending splits, and reset independently', (t) => {
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
  document.addEventListener('island:ready', (event) => ready.push(event.target));
  mount(first);
  mount(second);
  assert.deepEqual(ready, [first, second]);
  const initial = first.querySelector('[role="status"]').textContent;
  const status = first.querySelector('[role="status"]');
  assert.equal(status.getAttribute('aria-live'), 'polite');
  assert.equal(status.getAttribute('aria-atomic'), 'true');
  for (const cap of [12, 24, 48]) for (const pack of [false, true]) {
    const capButton = first.querySelector(`[data-cap="${cap}"]`);
    const packButton = first.querySelector(`[data-pack="${pack}"]`);
    capButton.focus();
    capButton.click();
    assert.equal(document.activeElement, capButton);
    packButton.focus();
    packButton.click();
    assert.equal(document.activeElement, packButton);
    assert.equal(capButton.getAttribute('aria-pressed'), 'true');
    assert.equal(packButton.getAttribute('aria-pressed'), 'true');
    const groups = groupParagraphs(PARAGRAPHS, cap, pack);
    assert.equal(first.querySelectorAll('[data-group]').length, groups.length);
    assert.deepEqual([...first.querySelectorAll('[data-member]')].map((member) => member.dataset.member), ['P1', 'P2', 'P3', 'P4']);
    assert.equal(first.querySelectorAll('[data-paragraph-output] .is-oversized').length, cap === 12 ? 1 : 0);
    assert.match(status.textContent, /all 45 source words/);
    if (cap === 12) assert.match(status.textContent, /P3 exceeds the cap/);
    assert.equal(second.querySelector('[role="status"]').textContent, initial);
    assert.equal(first.querySelector('[data-paragraph="P3"] .qi-chunk__text').textContent, PARAGRAPHS[2].text);
  }
  first.querySelector('[data-reset]').click();
  assert.equal(status.textContent, initial);
  assert.equal(first.querySelector('[data-cap="24"]').getAttribute('aria-pressed'), 'true');
  assert.equal(first.querySelector('[data-pack="false"]').getAttribute('aria-pressed'), 'true');
  assert.equal(first.querySelectorAll('[data-group]').length, 4);
});
