/*
 * encoder island: interactive replacement for updated-encoder.png.
 *
 * A query encoder turns the query into a vector, and the nearest documents are
 * the results. A relevance-aware query encoder also takes the feedback, so the
 * vector it produces moves toward what the feedback marked as relevant.
 * Switch between the two. The vectors and results are illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('sf-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('sf-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

const PLAIN = {
  enc: 'Query encoder',
  vec: ['0.9', '0.2', '0.1', '...'],
  results: [
    { t: 'Vector Search', k: 'strong' },
    { t: 'Euclidean Vector', k: 'light' },
    { t: 'Vector Graphics', k: 'none' },
  ],
};
const AWARE = {
  enc: 'Relevance-aware encoder',
  vec: ['0.7', '0.8', '0.1', '...'],
  results: [
    { t: 'Qdrant Search', k: 'strong' },
    { t: 'Semantic Search', k: 'strong' },
    { t: 'Euclidean Distance', k: 'light' },
  ],
};

const WIDE = { VB_W: 760, VB_H: 372 };
const NARROW = { VB_W: 340, VB_H: 560 };

export function mount(node) {
  node.classList.add('sf-en');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Encoder">',
    '      <button type="button" class="qi-chip" data-mode="plain" aria-pressed="false">Query encoder</button>',
    '      <button type="button" class="qi-chip" data-mode="aware" aria-pressed="false">Relevance-aware encoder</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 330" role="img" aria-label="A query encoder produces a query vector and results; a relevance-aware encoder also uses feedback, and produces a different vector and better results.">',
    '    <g class="sf-en__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 sf-en__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.sf-en__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.sf-en__status');
  const chips = [...node.querySelectorAll('[data-mode]')];
  let mode = 'aware';
  const isNarrow = watchNarrow(node, () => render());

  const box = (x, y, w, h, text, cls = '') => {
    g.appendChild(el('rect', { class: `sf-en__box ${cls}`, x, y, width: w, height: h, rx: 5 }));
    g.appendChild(el('text', { class: 'qi-label qi-label--strong sf-en__t', x: x + w / 2, y: y + h / 2 + 5, 'text-anchor': 'middle' }, text));
  };
  const arrow = (x1, y1, x2, y2, cls = '') => {
    g.appendChild(el('line', { class: `sf-en__arrow ${cls}`, x1, y1, x2: x2 - (x2 > x1 ? 7 : 0), y2: y2 - (y2 > y1 ? 7 : 0) }));
    const p = x2 > x1 ? `${x2},${y2} ${x2 - 8},${y2 - 4.5} ${x2 - 8},${y2 + 4.5}` : `${x2},${y2} ${x2 - 4.5},${y2 - 8} ${x2 + 4.5},${y2 - 8}`;
    g.appendChild(el('polygon', { class: `sf-en__head ${cls}`, points: p }));
  };
  const vector = (x, y, vals, cls) => {
    vals.forEach((v, i) => {
      g.appendChild(el('rect', { class: `sf-en__cell ${cls}`, x: x + i * 44, y, width: 44, height: 30, rx: 3 }));
      g.appendChild(el('text', { class: 'qi-label sf-en__t', x: x + i * 44 + 22, y: y + 20, 'text-anchor': 'middle' }, v));
    });
  };
  const results = (x, y, w, list) => list.forEach((r, i) => box(x, y + i * 40, w, 32, r.t, `is-${r.k}`));
  const label = (x, y, t) => g.appendChild(el('text', { class: 'qi-label', x, y }, t));

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    const aware = mode === 'aware';
    const cur = aware ? AWARE : PLAIN;
    if (!narrow) {
      label(10, 20, 'Query');
      box(10, 30, 150, 40, '"Vector"', 'is-query');
      if (aware) {
        // first-round results feed the encoder as feedback
        label(10, 112, 'First results (feedback)');
        PLAIN.results.forEach((r, i) => box(10, 124 + i * 40, 190, 32, r.t, `is-${r.k}`));
        arrow(200, 140, 292, 100, 'is-fb');
        arrow(160, 50, 292, 78);
      } else {
        arrow(160, 50, 292, 80);
      }
      const ex = 294;
      const eh = aware ? 50 : 40;
      box(ex, 60, 200, eh, cur.enc, aware ? 'is-aware' : 'is-enc');
      const ey = 60 + eh;
      arrow(ex + 100, ey, ex + 100, ey + 36);
      vector(ex + 12, ey + 36, cur.vec, aware ? 'is-aware' : '');
      arrow(ex + 100, ey + 66, ex + 100, ey + 100);
      label(ex, ey + 118, 'Results');
      results(ex, ey + 128, 200, cur.results);
    } else {
      let y = 20;
      label(10, y, 'Query');
      box(10, y + 10, 140, 36, '"Vector"', 'is-query');
      y += 64;
      if (aware) {
        label(10, y, 'First results (feedback)');
        PLAIN.results.forEach((r, i) => box(10, y + 10 + i * 38, 220, 30, r.t, `is-${r.k}`));
        y += 10 + 3 * 38 + 8;
        arrow(120, y, 120, y + 28, 'is-fb');
        y += 36;
      }
      box(10, y, 320, aware ? 52 : 40, cur.enc, aware ? 'is-aware' : 'is-enc');
      y += (aware ? 52 : 40) + 10;
      arrow(170, y, 170, y + 26);
      y += 36;
      vector(10, y, cur.vec, aware ? 'is-aware' : '');
      y += 40;
      arrow(95, y, 95, y + 26);
      y += 40;
      label(10, y, 'Results');
      results(10, y + 8, 320, cur.results);
      y += 8 + 3 * 40;
      svg.setAttribute('viewBox', `0 0 340 ${y + 10}`);
    }
    statusEl.innerHTML = aware
      ? 'A <b>relevance-aware query encoder</b> takes the query <i>and</i> the feedback from the first results. Its vector (<b>0.7, 0.8, ...</b>) differs from the plain one, and it retrieves results closer to what the feedback marked as relevant. Vectors and results are illustrative.'
      : 'A plain <b>query encoder</b> turns <b>"Vector"</b> into one vector (<b>0.9, 0.2, ...</b>), and the nearest documents are the results. It knows nothing about what the user found relevant.';
  }

  function setMode(m) {
    mode = m;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  setMode('aware');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
