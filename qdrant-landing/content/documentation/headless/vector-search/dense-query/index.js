/*
 * dense-query island: interactive replacement for deep-neural.png and
 * input.png on the vector search overview page. Styled like the sparse-query
 * and code-tokenizer islands (hint labels in one column, boxes in the other).
 *
 * The page's query and a second query, picked from a few presets, are each
 * turned into a dense vector by a neural encoder. For each preset the island
 * compares two scores against the page's query:
 *
 *   Shared words  keyword overlap, as a sparse vector sees it: how many of
 *                 the page query's five tokens (stripe, blue, shirt, make,
 *                 cotton) the other query also has, after the same stopword
 *                 removal and root forms as the sparse-query island.
 *   Similarity    cosine similarity of the two dense vectors.
 *
 * The German query shares no words but is close in meaning; the boots query
 * shares no words and is far in meaning. Keyword overlap can't tell them
 * apart; the dense similarity can.
 *
 * All numbers are real, computed once offline with
 * sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (384
 * dimensions, normalized). The 8 values shown per vector are dimensions
 * 145, 164, 168, 197, 246, 259, 289 and 364: the 8 where the page query's
 * values are largest. Cosine similarity uses all 384.
 *
 * Plain HTML + CSS on the shared island design system (islands.scss).
 */

const MODEL = 'paraphrase-multilingual-MiniLM-L12-v2';
const DIMS = 384;
const BASE = {
  text: 'striped blue shirt made from cotton',
  vals: [-0.13, -0.14, 0.14, -0.14, 0.16, -0.16, 0.13, 0.13],
};
const BASE_TOKENS = 5;

const PRESETS = [
  {
    text: 'blue and white striped cotton shirt',
    vals: [-0.09, -0.11, 0.13, -0.13, 0.15, -0.15, 0.12, 0.13],
    shared: 4,
    cos: 0.95,
    status:
      'Different word order and an extra word, but the same shirt. Both scores are high: the queries share four words, and their vectors are almost the same.',
  },
  {
    text: 'cotton-made maritime shirt',
    vals: [-0.11, -0.13, 0.13, -0.11, 0.12, -0.09, 0.06, 0.15],
    shared: 3,
    cos: 0.76,
    status:
      'Three shared words. The vectors are a little further apart, but the model still places both queries close together: a shirt made of cotton.',
  },
  {
    text: 'gestreiftes blaues Baumwollhemd',
    vals: [-0.08, -0.15, 0.1, -0.12, 0.15, -0.11, 0.12, 0.14],
    shared: 0,
    cos: 0.89,
    status:
      'The same request in German. It shares no words with the English query, so keyword overlap scores it zero. The model was trained on many languages and places it close to the English query.',
  },
  {
    text: 'red leather boots',
    vals: [-0.1, 0.01, 0.08, 0.09, -0.03, 0.0, -0.05, -0.01],
    shared: 0,
    cos: 0.06,
    status:
      'No shared words, and this time the meaning is different too, so the vectors point in different directions. Keyword overlap scores this query the same as the German one. The dense similarity tells them apart.',
  },
];
const START = 2;
const MAX_ABS = 0.16; // largest |value| shown, for the cell shading

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (v) => (v === 0 ? '0.00' : v.toFixed(2)).replace('-', '−');

// One vector: 8 shaded cells, then "…" for the rest of the dimensions.
function cells(vals) {
  return (
    vals
      .map((v) => {
        const a = Math.min(1, Math.abs(v) / MAX_ABS).toFixed(2);
        return `<li class="qi-dq__cell ${v < 0 ? 'is-neg' : 'is-pos'}" style="--a:${a}">${fmt(v)}</li>`;
      })
      .join('') + '<li class="qi-dq__more" aria-hidden="true">…</li>'
  );
}

export function mount(node) {
  node.classList.add('qi-dq');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-dq__fields">',
    '    <span class="qi-hint">Query</span>',
    `    <div class="qi-dq__query">${esc(BASE.text)}</div>`,
    '    <span class="qi-hint">Dense vector</span>',
    `    <ul class="qi-dq__vector" aria-label="Dense vector of the query, 8 of ${DIMS} dimensions">${cells(BASE.vals)}</ul>`,
    '    <span class="qi-hint qi-dq__top">Compare with</span>',
    '    <div class="qi-group" role="group" aria-label="Second query">',
    PRESETS.map((p, i) => `<button type="button" class="qi-chip" data-p="${i}" aria-pressed="false">${esc(p.text)}</button>`).join(''),
    '    </div>',
    '    <span class="qi-hint">Dense vector</span>',
    `    <ul class="qi-dq__vector qi-dq__vector--b" aria-label="Dense vector of the second query, 8 of ${DIMS} dimensions"></ul>`,
    '    <span></span>',
    `    <span class="qi-hint qi-dq__note">8 of ${DIMS} dimensions shown · encoder: ${MODEL}</span>`,
    '    <span class="qi-hint">Shared words</span>',
    '    <div class="qi-dq__score qi-dq__score--sparse"><span class="qi-dq__track"><span class="qi-dq__fill"></span></span><b class="qi-dq__num"></b></div>',
    '    <span class="qi-hint">Similarity</span>',
    '    <div class="qi-dq__score qi-dq__score--dense"><span class="qi-dq__track"><span class="qi-dq__fill"></span></span><b class="qi-dq__num"></b></div>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-dq__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const btns = [...node.querySelectorAll('[data-p]')];
  const vecB = node.querySelector('.qi-dq__vector--b');
  const sparse = node.querySelector('.qi-dq__score--sparse');
  const dense = node.querySelector('.qi-dq__score--dense');
  const statusEl = node.querySelector('.qi-dq__status');

  function render(i) {
    const p = PRESETS[i];
    btns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.p) === i)));
    vecB.innerHTML = cells(p.vals);
    sparse.querySelector('.qi-dq__fill').style.width = `${(p.shared / BASE_TOKENS) * 100}%`;
    sparse.querySelector('.qi-dq__num').textContent = `${p.shared} of ${BASE_TOKENS}`;
    dense.querySelector('.qi-dq__fill').style.width = `${Math.max(0, p.cos) * 100}%`;
    dense.querySelector('.qi-dq__num').textContent = p.cos.toFixed(2);
    statusEl.textContent = p.status;
  }

  btns.forEach((b) => b.addEventListener('click', () => render(Number(b.dataset.p))));
  render(START);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
