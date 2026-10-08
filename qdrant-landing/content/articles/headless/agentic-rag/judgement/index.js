/*
 * judgement island: interactive replacement for quality-judgement.png.
 *
 * An LLM or vision model scores each retrieved item against the query. The agent
 * compares the scores with a threshold: if an item is good enough it answers,
 * otherwise it takes another step or admits that it has no good answer. The scores
 * are illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';
const QUERY = 'mens denim jacket jeans coat outerwear size large';
const ITEMS = [
  { name: 'Item A', score: 0.5321 },
  { name: 'Item B', score: 0.9214 },
  { name: 'Item C', score: 0.7274 },
];
const THRESHOLDS = [0.6, 0.8, 0.95];

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
  node.classList.toggle('ag-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('ag-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

export function mount(node) {
  node.classList.add('ag-jd');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Quality threshold">',
    THRESHOLDS.map((t) => `<button type="button" class="qi-chip" data-t="${t}" aria-pressed="false">Threshold ${t}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 260" role="img" aria-label="An LLM scores three retrieved items against the query. Items at or above the threshold are good enough to answer from.">',
    '    <g class="ag-jd__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ag-jd__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ag-jd__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ag-jd__status');
  const chips = [...node.querySelectorAll('[data-t]')];
  let threshold = 0.8;
  const isNarrow = watchNarrow(node, () => render());

  function render() {
    const narrow = isNarrow();
    const W = narrow ? 340 : 760;
    const bx = narrow ? 92 : 130;
    const bw = narrow ? 190 : 520;
    g.replaceChildren();
    const qLines = narrow ? ['mens denim jacket jeans', 'coat outerwear size large'] : [QUERY];
    const qh = qLines.length > 1 ? 62 : 44;
    g.appendChild(el('text', { class: 'ag-jd__sub', x: 20, y: 18 }, 'query'));
    g.appendChild(el('rect', { class: 'ag-jd__query', x: 20, y: 26, width: W - 40, height: qh, rx: 8 }));
    qLines.forEach((line, i) => g.appendChild(el('text', { class: 'ag-jd__text', x: W / 2, y: 54 + i * 20, 'text-anchor': 'middle' }, line)));
    const top = 26 + qh + 34;
    g.appendChild(el('text', { class: 'ag-jd__sub', x: 20, y: top - 12 }, 'score from an LLM or a vision model'));
    const passing = ITEMS.filter((it) => it.score >= threshold);
    ITEMS.forEach((it, i) => {
      const y = top + i * 50;
      const ok = it.score >= threshold;
      g.appendChild(el('text', { class: 'ag-jd__item', x: 20, y: y + 24 }, it.name));
      g.appendChild(el('rect', { class: 'ag-jd__track', x: bx, y, width: bw, height: 32, rx: 6 }));
      g.appendChild(el('rect', { class: `ag-jd__bar${ok ? ' is-ok' : ''}`, x: bx, y, width: Math.max(bw * it.score, 4), height: 32, rx: 6 }));
      g.appendChild(el('text', { class: 'ag-jd__item', x: bx + Math.max(bw * it.score, 4) - 10, y: y + 22, 'text-anchor': 'end' }, it.score.toFixed(2)));
    });
    const tx = bx + bw * threshold;
    g.appendChild(el('line', { class: 'ag-jd__threshold', x1: tx, y1: top - 8, x2: tx, y2: top + 3 * 50 - 10 }));
    g.appendChild(el('text', { class: 'ag-jd__sub', x: tx, y: top + 3 * 50 + 8, 'text-anchor': 'middle' }, `threshold ${threshold}`));
    svg.setAttribute('viewBox', `0 0 ${W} ${top + 3 * 50 + 22}`);
    const best = ITEMS.reduce((a, b) => (b.score > a.score ? b : a));
    statusEl.textContent = passing.length
      ? `${passing.length === 1 ? '1 item reaches' : `${passing.length} items reach`} the threshold, and the best is ${best.name}. The agent can answer from it.`
      : `No item reaches ${threshold}. The agent takes another step, for example it rewrites the query and searches again, or it admits that it has no good answer.`;
  }

  function setT(t) {
    threshold = t;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.t) === threshold)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setT(Number(b.dataset.t))));

  setT(0.8);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
