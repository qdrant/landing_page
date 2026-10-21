/*
 * sparse-query island: interactive replacement for tokenization.png and
 * query.png on the vector search overview page.
 *
 * A product description (the document) and a search query both go through
 * the same keyword pipeline: split into words, drop stopwords, reduce each
 * word to its root form. Each becomes a sparse vector with one position per
 * dictionary word: 1.0 where the text has that word, 0.0 everywhere else.
 * Only the positions either text uses are drawn; "…" stands for the
 * thousands of zero positions in between.
 *
 * Preset queries show how keyword overlap works and where it breaks: the
 * page's query shares most of its words with the document, while a query
 * with the same meaning in other words, or in another language, shares none.
 * That sets up the synonym and multilingual problems of the next section.
 *
 * The texts are fixed, so tokens, stopwords and root forms are hardcoded.
 * Root forms follow the original illustration (striped -> stripe,
 * made -> make).
 *
 * Plain HTML + CSS on the shared island design system (islands.scss).
 */

// Each word: [as written, token]. A null token marks a stopword.
const DOCUMENT = {
  text: 'Blue cotton shirt with white stripes',
  words: [['Blue', 'blue'], ['cotton', 'cotton'], ['shirt', 'shirt'], ['with', null], ['white', 'white'], ['stripes', 'stripe']],
};

const QUERIES = [
  {
    text: 'striped blue shirt made from cotton',
    words: [['striped', 'stripe'], ['blue', 'blue'], ['shirt', 'shirt'], ['made', 'make'], ['from', null], ['cotton', 'cotton']],
    status:
      'The query shares four words with the document: <code>blue</code>, <code>cotton</code>, <code>shirt</code>, and <code>stripe</code>. Thanks to the root forms, <code>striped</code> matches <code>stripes</code>.',
  },
  {
    text: 'cotton-made maritime shirt',
    words: [['cotton', 'cotton'], ['made', 'make'], ['maritime', 'maritime'], ['shirt', 'shirt']],
    status:
      'Only <code>cotton</code> and <code>shirt</code> match. A maritime shirt is a striped one, but <code>maritime</code> is a different word, so it doesn’t count.',
  },
  {
    text: 'navy pinstripe tee',
    words: [['navy', 'navy'], ['pinstripe', 'pinstripe'], ['tee', 'tee']],
    status:
      'No words match. The query describes the same kind of shirt, but in different words, so its vector has no 1.0 in common with the document’s.',
  },
  {
    text: 'gestreiftes blaues Baumwollhemd',
    words: [['gestreiftes', 'gestreiftes'], ['blaues', 'blaues'], ['Baumwollhemd', 'baumwollhemd']],
    status:
      'No words match. The query is the same request in German, and every word in it is different from the English ones.',
  },
];

const tokens = (t) => t.words.map(([, tok]) => tok).filter(Boolean);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// One text's words, each with the token it becomes (or crossed out).
function wordsHtml(t) {
  return t.words
    .map(([word, tok]) => {
      if (!tok) {
        return `<li class="qi-sq__word is-stop"><span class="qi-sq__in">${esc(word)}</span><span class="qi-sq__out">${esc(word)}</span></li>`;
      }
      const changed = tok !== word.toLowerCase();
      return `<li class="qi-sq__word${changed ? ' is-root' : ''}"><span class="qi-sq__in">${esc(word)}</span><span class="qi-sq__out">${esc(tok)}</span></li>`;
    })
    .join('');
}

export function mount(node) {
  node.classList.add('qi-sq');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Query">',
    '      <span class="qi-hint">Query:</span>',
    QUERIES.map((q, i) => `<button type="button" class="qi-chip" data-q="${i}" aria-pressed="false">${esc(q.text)}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <div class="qi-sq__texts">',
    '    <div class="qi-sq__text">',
    '      <span class="qi-hint">Document</span>',
    `      <ul class="qi-sq__words" aria-label="Document words and their tokens">${wordsHtml(DOCUMENT)}</ul>`,
    '    </div>',
    '    <div class="qi-sq__text">',
    '      <span class="qi-hint">Query</span>',
    '      <ul class="qi-sq__words qi-sq__words--query" aria-label="Query words and their tokens"></ul>',
    '    </div>',
    '  </div>',
    '  <div class="qi-sq__wordkey qi-sq__key">',
    '    <i class="qi-sq__swatch is-root"></i>reduced to its root form <i class="qi-sq__swatch is-stop"></i>stopword, dropped',
    '  </div>',
    '  <div class="qi-sq__legend">',
    '    <span class="qi-hint">Sparse vectors, one position per dictionary word (A–Z)</span>',
    '    <span class="qi-sq__key"><i class="qi-sq__swatch is-one"></i>1.0: word present <i class="qi-sq__swatch is-shared"></i>in both</span>',
    '  </div>',
    '  <div class="qi-sq__vector" role="table" aria-label="Sparse vectors of the document and the query">',
    '    <div class="qi-sq__heads" role="rowgroup" aria-hidden="true">',
    '      <span class="qi-sq__head">Document</span>',
    '      <span class="qi-sq__head">Query</span>',
    '      <span class="qi-sq__head qi-sq__head--label"></span>',
    '    </div>',
    '    <div class="qi-sq__cols"></div>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-sq__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const btns = [...node.querySelectorAll('[data-q]')];
  const queryWords = node.querySelector('.qi-sq__words--query');
  const cols = node.querySelector('.qi-sq__cols');
  const statusEl = node.querySelector('.qi-sq__status');
  const docTokens = new Set(tokens(DOCUMENT));

  function render(i, animate) {
    const q = QUERIES[i];
    btns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.q) === i)));
    queryWords.innerHTML = wordsHtml(q);

    // The dictionary positions either text uses, in dictionary order, with
    // "…" for the zero positions between them.
    const qTokens = new Set(tokens(q));
    const terms = [...new Set([...docTokens, ...qTokens])].sort((a, b) => a.localeCompare(b, 'en'));
    const gap = '<div class="qi-sq__col qi-sq__col--gap" aria-hidden="true"><span class="qi-sq__dots">…</span><span class="qi-sq__dots">…</span><span class="qi-sq__term"></span></div>';
    const cell = (on) => `<span class="qi-sq__cell${on ? ' is-one' : ''}" role="cell">${on ? '1.0' : '0.0'}</span>`;
    cols.innerHTML =
      gap +
      terms
        .map((t) => {
          const d = docTokens.has(t);
          const qq = qTokens.has(t);
          const cls = ['qi-sq__col', d && qq ? 'is-shared' : '', qq && animate ? 'is-new' : ''].filter(Boolean).join(' ');
          return `<div class="${cls}" role="row">${cell(d)}${cell(qq)}<span class="qi-sq__term" role="rowheader">${esc(t)}</span></div>` + gap;
        })
        .join('');

    statusEl.innerHTML = q.status;
  }

  btns.forEach((b) => b.addEventListener('click', () => render(Number(b.dataset.q), true)));
  render(0, false);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
