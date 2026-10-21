/*
 * sparse-query island: replacement for tokenization.png and query.png on the
 * vector search overview page. A still diagram, no controls.
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

// [as written, token]. A null token marks a stopword.
const QUERY = [['striped', 'stripe'], ['blue', 'blue'], ['shirt', 'shirt'], ['made', 'make'], ['from', null], ['cotton', 'cotton']];

// Dictionary positions to draw, in order. null is a "…" run of zeros.
const DICTIONARY = ['aback', null, 'black', 'blue', null, 'cotton', null, 'make', null, 'shirt', 'shiver', null, 'stripe', null, 'zymase'];

export function mount(node) {
  node.classList.add('qi-sq');

  const tokens = new Set(QUERY.map(([, t]) => t).filter(Boolean));

  const words = QUERY.map(([word, tok]) => {
    const cls = !tok ? ' is-stop' : tok !== word ? ' is-root' : '';
    return `<li class="qi-sq__word${cls}"><span class="qi-sq__in">${word}</span><span class="qi-sq__out">${tok || word}</span></li>`;
  }).join('');

  const cols = DICTIONARY.map((term) => {
    if (!term) return '<li class="qi-sq__col qi-sq__col--gap" aria-hidden="true"><span class="qi-sq__dots">…</span></li>';
    const on = tokens.has(term);
    return (
      `<li class="qi-sq__col${on ? ' is-one' : ''}">` +
      `<span class="qi-sq__cell">${on ? '1.0' : '0.0'}</span>` +
      `<span class="qi-sq__term">${term}</span></li>`
    );
  }).join('');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-sq__step">',
    '    <span class="qi-hint">Query</span>',
    '    <div class="qi-sq__sentence">“striped blue shirt made from cotton”</div>',
    '  </div>',
    '  <div class="qi-sq__step">',
    '    <span class="qi-hint">Tokens</span>',
    `    <ul class="qi-sq__words" aria-label="Each query word and the token it becomes">${words}</ul>`,
    '    <div class="qi-sq__key">',
    '      <i class="qi-sq__swatch is-root"></i>reduced to its root form',
    '      <i class="qi-sq__swatch is-stop"></i>stopword, dropped',
    '    </div>',
    '  </div>',
    '  <div class="qi-sq__step">',
    '    <span class="qi-hint">Sparse vector: one position per dictionary word (A–Z)</span>',
    `    <ul class="qi-sq__vector" aria-label="Sparse vector of the query">${cols}</ul>`,
    '  </div>',
    '</div>',
  ].join('');

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
