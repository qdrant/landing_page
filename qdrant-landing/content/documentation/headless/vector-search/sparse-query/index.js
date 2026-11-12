/*
 * sparse-query island: replacement for tokenization.png and query.png on the
 * vector search overview page. A still diagram, no controls; styled like the
 * code-tokenizer island (hint labels in one column, token boxes in the other).
 *
 * The page's example query goes through the keyword pipeline: split into
 * words, drop stopwords, reduce each word to its root form. The tokens become
 * a sparse vector with one position per dictionary word, in dictionary
 * order: 1.0 where the query has that word, 0.0 everywhere else. A few
 * neighboring dictionary words are drawn as 0.0, and "…" stands for the
 * thousands of zero positions in between.
 *
 * Root forms follow the original illustration (striped -> stripe,
 * made -> make).
 *
 * Plain HTML + CSS on the shared island design system (islands.scss).
 */

const QUERY = 'striped blue shirt made from cotton';
// [as written, token]. A null token marks a stopword.
const WORDS = [['striped', 'stripe'], ['blue', 'blue'], ['shirt', 'shirt'], ['made', 'make'], ['from', null], ['cotton', 'cotton']];
// Dictionary positions to draw, in order. null is a "…" run of zeros.
const DICTIONARY = ['aback', null, 'black', 'blue', null, 'cotton', null, 'make', null, 'shirt', 'shiver', null, 'stripe', null, 'zymase'];

const item = (cls, text) => `<li class="qi-sq__token${cls}">${text}</li>`;

export function mount(node) {
  node.classList.add('qi-sq');

  const tokens = WORDS.filter(([, t]) => t);
  const present = new Set(tokens.map(([, t]) => t));

  const words = WORDS.map(([w, t]) => item(t ? '' : ' is-stop', w)).join('');
  const toks = tokens.map(([w, t]) => item(t !== w ? ' is-root' : '', t)).join('');
  const cells = DICTIONARY.map((term) =>
    term
      ? `<li class="qi-sq__pos${present.has(term) ? ' is-one' : ''}">` +
        `<span class="qi-sq__cell">${present.has(term) ? '1.0' : '0.0'}</span>` +
        `<span class="qi-sq__term">${term}</span></li>`
      : '<li class="qi-sq__gap" aria-hidden="true">…</li>',
  ).join('');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-sq__fields">',
    '    <span class="qi-hint">Query</span>',
    `    <div class="qi-sq__query">${QUERY}</div>`,
    '    <span class="qi-hint">Words</span>',
    `    <ul class="qi-sq__tokens" aria-label="Query words">${words}</ul>`,
    '    <span class="qi-hint">Tokens</span>',
    `    <ul class="qi-sq__tokens" aria-label="Tokens after stopword removal and root forms">${toks}</ul>`,
    '    <span></span>',
    '    <span class="qi-hint qi-sq__legend">',
    '      <span class="qi-sq__keyitem"><span class="qi-sq__key is-stop" aria-hidden="true"></span>stopword, dropped</span>',
    '      <span class="qi-sq__keyitem"><span class="qi-sq__key is-root" aria-hidden="true"></span>reduced to its root form</span>',
    '    </span>',
    '    <span class="qi-hint qi-sq__top">Sparse vector</span>',
    `    <ul class="qi-sq__vector" aria-label="Sparse vector, one position per dictionary word">${cells}</ul>`,
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-sq__status">',
    '    The vector has one position per dictionary word, in alphabetical order. Only the query’s five tokens are 1.0. The thousands of other positions are 0.0, which is why the vector is called sparse.',
    '  </p>',
    '</div>',
  ].join('');

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
