import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// Articles set toc_start_level: 2, so a level-1 heading in the body has an id
// but no entry in the sidebar. The scroll spy must still highlight the link
// that points at the heading in view.
const html = `
  <nav id="TableOfContents">
    <ul>
      <li><a href="#what-is-it">What is it?</a></li>
      <li><a href="#faster-search">Faster search</a></li>
      <li><a href="#storage">Storage</a></li>
    </ul>
  </nav>
  <article class="documentation-article">
    <h1 id="article-intro">Article intro</h1>
    <h2 id="what-is-it">What is it?</h2>
    <h2 id="faster-search">Faster search</h2>
    <h2 id="storage">Storage</h2>
  </article>`;

const { window } = new JSDOM(html);
let observerCallback = null;
globalThis.document = window.document;
globalThis.IntersectionObserver = class {
  constructor(callback) {
    observerCallback = callback;
  }
  observe() {}
};

// The docs and marketing bundles each ship a copy of the scroll spy.
const modules = ['docs', 'marketing'];

const activeHref = () => document.querySelector('#TableOfContents a.active')?.getAttribute('href') ?? null;
const visible = (id) => ({ target: document.getElementById(id), isIntersecting: true });
const hidden = (id) => ({ target: document.getElementById(id), isIntersecting: false });

for (const bundle of modules) {
  test(`${bundle}: highlights the link for the visible heading when the TOC skips a heading level`, async () => {
    const { default: TableOfContents } = await import(`../../themes/qdrant-2024/assets/${bundle}/js/table-of-content.js`);
    document.querySelectorAll('#TableOfContents a').forEach((link) => link.classList.remove('active'));
    new TableOfContents('#TableOfContents', '.documentation-article');

    observerCallback([visible('what-is-it')]);
    assert.equal(activeHref(), '#what-is-it');

    observerCallback([hidden('what-is-it'), visible('storage')]);
    assert.equal(activeHref(), '#storage');
  });
}
