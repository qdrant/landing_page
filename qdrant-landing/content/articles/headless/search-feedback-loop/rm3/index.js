/*
 * rm3 island: interactive replacement for relevance-models.png.
 *
 * Query expansion with a relevance model such as RM3, on a toy example:
 *   1 First search:   the query "Vector" returns three results, some more
 *                     relevant to what the user means than others.
 *   2 Pick terms:     terms are chosen from the (pseudo-)relevant results by how
 *                     likely they are; weak terms are dropped.
 *   3 Search again:   the expanded query returns better results.
 * The terms and results are an illustration, not real RM3 output.
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


const FIRST = [
  { t: 'Vector Search', k: 'strong' },
  { t: 'Euclidean Vector', k: 'light' },
  { t: 'Vector Graphics', k: 'none' },
];
const TERMS = [
  { t: 'Search', k: 'strong', keep: true },
  { t: 'Euclidean', k: 'light', keep: true },
  { t: 'Graphics', k: 'none', keep: false },
];
const SECOND = [
  { t: 'Qdrant Vector Search', k: 'strong' },
  { t: 'Vector Search Metric', k: 'strong' },
  { t: 'Euclidean Vector Space', k: 'light' },
];
const STEPS = [
  { id: 1, label: '1 First search' },
  { id: 2, label: '2 Pick expansion terms' },
  { id: 3, label: '3 Search again' },
];

const WIDE = { VB_W: 760, VB_H: 250 };
const NARROW = { VB_W: 340, VB_H: 500 };

export function mount(node) {
  node.classList.add('sf-rm');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    STEPS.map((s) => `<button type="button" class="qi-chip" data-step="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 250" role="img" aria-label="A query is expanded with terms from its first results by a relevance model, and the expanded query returns better results.">',
    '    <g class="sf-rm__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 sf-rm__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.sf-rm__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.sf-rm__status');
  const chips = [...node.querySelectorAll('[data-step]')];
  let step = 1;
  const isNarrow = watchNarrow(node, () => render());

  const box = (x, y, w, h, text, cls = '') => {
    g.appendChild(el('rect', { class: `sf-rm__box ${cls}`, x, y, width: w, height: h, rx: 5 }));
    g.appendChild(el('text', { class: 'qi-label qi-label--strong sf-rm__t', x: x + w / 2, y: y + h / 2 + 5, 'text-anchor': 'middle' }, text));
  };
  const title = (x, y, t) => g.appendChild(el('text', { class: 'qi-label', x, y }, t));
  const arrow = (x1, y1, x2, y2) => {
    g.appendChild(el('line', { class: 'sf-rm__arrow', x1, y1, x2: x2 - (x2 > x1 ? 7 : 0), y2: y2 - (y2 > y1 ? 7 : 0) }));
    const p = x2 > x1 ? `${x2},${y2} ${x2 - 8},${y2 - 4.5} ${x2 - 8},${y2 + 4.5}` : `${x2},${y2} ${x2 - 4.5},${y2 - 8} ${x2 + 4.5},${y2 - 8}`;
    g.appendChild(el('polygon', { class: 'sf-rm__head', points: p }));
  };

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    if (!narrow) {
      title(10, 22, 'Query');
      box(10, 34, 190, 40, '"Vector"', 'is-query');
      arrow(170, 74, 170, 118);
      title(10, 112, 'First results');
      FIRST.forEach((r, i) => box(10, 124 + i * 40, 190, 32, r.t, `is-${r.k}`));
      if (step >= 2) {
        arrow(200, 140, 262, 140);
        title(264, 112, 'Relevance model (RM3)');
        TERMS.forEach((r, i) => {
          box(264, 124 + i * 40, 150, 32, r.t, `is-${r.k}${r.keep ? '' : ' is-drop'}`);
          if (!r.keep) g.appendChild(el('text', { class: 'qi-label sf-rm__drop', x: 424, y: 124 + i * 40 + 21 }, 'dropped'));
        });
      }
      if (step >= 3) {
        arrow(414, 140, 490, 140);
        title(492, 22, 'Expanded query');
        box(492, 34, 250, 40, '"Euclidean Vector Search"', 'is-query');
        arrow(710, 74, 710, 118);
        title(492, 112, 'New results');
        SECOND.forEach((r, i) => box(492, 124 + i * 40, 250, 32, r.t, `is-${r.k}`));
      }
    } else {
      let y = 22;
      title(10, y, 'Query');
      box(10, y + 10, 140, 36, '"Vector"', 'is-query');
      y += 70;
      title(10, y, 'First results');
      FIRST.forEach((r, i) => box(10, y + 10 + i * 40, 220, 32, r.t, `is-${r.k}`));
      y += 10 + 3 * 40 + 14;
      if (step >= 2) {
        arrow(120, y - 14, 120, y + 14);
        y += 30;
        title(10, y, 'Relevance model (RM3) picks terms');
        TERMS.forEach((r, i) => {
          box(10, y + 10 + i * 40, 150, 32, r.t, `is-${r.k}${r.keep ? '' : ' is-drop'}`);
          if (!r.keep) g.appendChild(el('text', { class: 'qi-label sf-rm__drop', x: 172, y: y + 10 + i * 40 + 21 }, 'dropped'));
        });
        y += 10 + 3 * 40 + 14;
      }
      if (step >= 3) {
        arrow(120, y - 14, 120, y + 14);
        y += 30;
        title(10, y, 'Expanded query');
        box(10, y + 10, 320, 36, '"Euclidean Vector Search"', 'is-query');
        y += 66;
        title(10, y, 'New results');
        SECOND.forEach((r, i) => box(10, y + 10 + i * 40, 320, 32, r.t, `is-${r.k}`));
        y += 10 + 3 * 40;
      }
      svg.setAttribute('viewBox', `0 0 340 ${y + 16}`);
    }
    statusEl.innerHTML = {
      1: 'The query <b>"Vector"</b> is ambiguous: its first results mix <b>Vector Search</b>, <b>Euclidean Vector</b>, and <b>Vector Graphics</b>. Darker green marks results closer to what the user means.',
      2: 'A relevance model such as <b>RM3</b> picks expansion terms from the relevant results by how likely they are, and drops the unlikely ones: <b>Search</b> and <b>Euclidean</b> stay, <b>Graphics</b> goes. The terms are illustrative.',
      3: 'The query becomes <b>"Euclidean Vector Search"</b>, and the new results are all closer to the intended meaning.',
    }[step];
  }

  function setStep(n) {
    step = n;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === step)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setStep(Number(b.dataset.step))));

  setStep(1);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
