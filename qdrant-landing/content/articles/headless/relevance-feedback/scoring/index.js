/*
 * scoring island: interactive replacement for context_pair.png,
 * confidence_of_context_pair.png, delta_as_distance.png and scoring.png.
 *
 * Walks through how feedback becomes a score, in four steps:
 *   1 Context pair: from the feedback model's scores, the document it scores
 *                   highest is the positive and the lowest is the negative.
 *   2 Confidence:   the gap between their feedback scores.
 *   3 Delta:        for a candidate, similarity to the positive minus
 *                   similarity to the negative (retriever similarities).
 *   4 Scoring:      F = a * score + confidence^b * c * delta.
 * All numbers are illustrative; a = b = c = 1 for the example.
 */

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

// Compact layout when the figure is narrower than the desktop composition, so
// labels stay readable instead of scaling down with the SVG.
function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('rf-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('rf-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

const DOCS = [
  { q: 0.8, f: 0.57 },
  { q: 0.72, f: 0.85 },
  { q: 0.58, f: 0.45 },
  { q: 0.55, f: 0.7 },
  { q: 0.42, f: 0.31 },
];
const POS = 1; // Doc#2
const NEG = 4; // Doc#5
const CONF = DOCS[POS].f - DOCS[NEG].f;
const CANDS = [
  { q: 0.83, pos: 0.52, neg: 0.66 },
  { q: 0.55, pos: 0.81, neg: 0.38 },
  { q: 0.3, pos: 0.35, neg: 0.58 },
];
const A = 1;
const B_EXP = 1;
const C = 1;
CANDS.forEach((c) => {
  c.delta = c.pos - c.neg;
  c.F = A * c.q + Math.pow(CONF, B_EXP) * C * c.delta;
});
const rankBy = (key) => [...CANDS.keys()].sort((i, j) => CANDS[j][key] - CANDS[i][key]);
const f2 = (v) => v.toFixed(2);
const sg = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);

const STEPS = [
  { id: 1, label: '1 Context pair' },
  { id: 2, label: '2 Confidence' },
  { id: 3, label: '3 Delta' },
  { id: 4, label: '4 Scoring' },
];

const WIDE = { VB_W: 760, VB_H: 420 };
const NARROW = { VB_W: 340, VB_H: 590 };

export function mount(node) {
  node.classList.add('rf-sc');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    STEPS.map((s) => `<button type="button" class="qi-chip" data-step="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 420" role="img" aria-label="How a context pair, its confidence, and a delta turn feedback scores into a new score for candidate documents.">',
    '    <g class="rf-sc__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 rf-sc__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.rf-sc__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.rf-sc__status');
  const chips = [...node.querySelectorAll('[data-step]')];
  let step = 1;
  const isNarrow = watchNarrow(node, () => render());

  const bar = (x, y, w, h, cls) => g.appendChild(el('rect', { class: `rf-sc__bar ${cls}`, x, y, width: Math.max(2, w), height: h, rx: 3 }));
  const txt = (x, y, t, cls = '', anchor = 'start') => g.appendChild(el('text', { class: `qi-label ${cls}`, x, y, 'text-anchor': anchor }, t));

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();

    if (step <= 2) {
      const x0 = 10;
      const labelW = narrow ? 64 : 80;
      const bw = narrow ? 190 : 270;
      const y0 = narrow ? 72 : 52;
      const pitch = narrow ? 56 : 66;
      txt(x0, 24, narrow ? 'Feedback model rescores results' : 'Feedback model rescores the top results', 'qi-label--strong');
      const lx = narrow ? 10 : 460;
      const ly = narrow ? 46 : 24;
      bar(lx, ly - 11, 14, 12, 'rf-sc__bar--q');
      txt(lx + 20, ly, 'retriever score');
      bar(lx + (narrow ? 140 : 150), ly - 11, 14, 12, 'rf-sc__bar--f');
      txt(lx + (narrow ? 160 : 170), ly, 'feedback score');
      DOCS.forEach((d, i) => {
        const y = y0 + i * pitch;
        const role = i === POS ? 'is-pos' : i === NEG ? 'is-neg' : '';
        g.appendChild(el('rect', { class: `rf-sc__doc ${role}`, x: x0, y, width: labelW, height: 40, rx: 5 }));
        txt(x0 + labelW / 2, y + 25, `Doc#${i + 1}`, 'qi-label--strong', 'middle');
        const bx = x0 + labelW + 12;
        bar(bx, y, d.q * bw, 18, 'rf-sc__bar--q');
        bar(bx, y + 22, d.f * bw, 18, 'rf-sc__bar--f');
        txt(bx + d.q * bw + 6, y + 14, f2(d.q));
        txt(bx + d.f * bw + 6, y + 36, f2(d.f));
      });

      const px = narrow ? 10 : 470;
      const py = narrow ? y0 + 5 * pitch + 52 : 96;
      txt(px, py - 14, 'Context pair', 'qi-label--strong');
      g.appendChild(el('rect', { class: 'rf-sc__pairbox is-pos', x: px, y: py, width: 110, height: 48, rx: 5 }));
      txt(px + 55, py + 20, 'Positive', 'rf-sc__poslab', 'middle');
      txt(px + 55, py + 38, `Doc#${POS + 1}`, 'qi-label--strong', 'middle');
      g.appendChild(el('rect', { class: 'rf-sc__pairbox is-neg', x: px + 130, y: py, width: 110, height: 48, rx: 5 }));
      txt(px + 185, py + 20, 'Negative', 'rf-sc__neglab', 'middle');
      txt(px + 185, py + 38, `Doc#${NEG + 1}`, 'qi-label--strong', 'middle');
      txt(px, py + 76, `highest feedback score: ${f2(DOCS[POS].f)}`);
      txt(px, py + 96, `lowest feedback score: ${f2(DOCS[NEG].f)}`);

      if (step === 2) {
        const bx = x0 + labelW + 12;
        const xp = bx + DOCS[POS].f * bw;
        const xn = bx + DOCS[NEG].f * bw;
        const yn = y0 + NEG * pitch + 22;
        g.appendChild(el('line', { class: 'rf-sc__conf-line', x1: xp, y1: y0 + POS * pitch + 22, x2: xp, y2: yn + 34 }));
        g.appendChild(el('line', { class: 'rf-sc__conf-arrow', x1: xn + 2, y1: yn + 26, x2: xp - 2, y2: yn + 26 }));
        txt((xn + xp) / 2, yn + 50, 'confidence', 'rf-sc__conflab', 'middle');
        txt(px, py + 128, `confidence = ${f2(DOCS[POS].f)} − ${f2(DOCS[NEG].f)} = ${f2(CONF)}`, 'qi-label--strong');
      }
    } else {
      const x0 = 10;
      const labelW = narrow ? 76 : 120;
      const bw = narrow ? 130 : 250;
      const y0 = 44;
      const pitch = narrow ? 168 : 116;
      txt(x0, 22, narrow ? 'Candidates vs the context pair' : `Candidates scored against the context pair (Doc#${POS + 1} positive, Doc#${NEG + 1} negative)`, 'qi-label--strong');
      const rankV = rankBy('q');
      const rankF = rankBy('F');
      CANDS.forEach((c, i) => {
        const y = y0 + i * pitch;
        g.appendChild(el('rect', { class: 'rf-sc__doc', x: x0, y, width: labelW, height: 66, rx: 5 }));
        txt(x0 + labelW / 2, y + 38, narrow ? `Cand.#${i + 1}` : `Candidate#${i + 1}`, 'qi-label--strong', 'middle');
        const bx = x0 + labelW + 12;
        bar(bx, y, c.q * bw, 18, 'rf-sc__bar--q');
        bar(bx, y + 24, c.pos * bw, 18, 'rf-sc__bar--pos');
        bar(bx, y + 48, c.neg * bw, 18, 'rf-sc__bar--neg');
        txt(bx + c.q * bw + 6, y + 14, `${f2(c.q)} to query`);
        txt(bx + c.pos * bw + 6, y + 38, `${f2(c.pos)} to positive`);
        txt(bx + c.neg * bw + 6, y + 62, `${f2(c.neg)} to negative`);
        const sx = bx + Math.min(c.pos, c.neg) * bw;
        const sw = Math.abs(c.delta) * bw;
        g.appendChild(el('rect', { class: `rf-sc__delta ${c.delta < 0 ? 'is-neg' : 'is-pos'}`, x: sx, y: y + (c.pos < c.neg ? 24 : 48), width: sw, height: 18, rx: 3 }));
        txt(x0 + labelW + 12, y + 84, `delta = ${f2(c.pos)} − ${f2(c.neg)} = ${sg(c.delta)}`, c.delta < 0 ? 'rf-sc__neglab' : 'rf-sc__poslab');
        if (step === 4) {
          txt(x0 + labelW + 12, y + 104, narrow ? `F = ${f2(c.F)}, rank ${rankF.indexOf(i) + 1} (was ${rankV.indexOf(i) + 1})` : `F = ${f2(c.q)} ${c.delta < 0 ? '\u2212' : '+'} ${f2(CONF)} \u00d7 ${f2(Math.abs(c.delta))} = ${f2(c.F)}, rank ${rankF.indexOf(i) + 1} (was ${rankV.indexOf(i) + 1})`, 'qi-label--strong');
        }
      });
    }

    statusEl.innerHTML = {
      1: `Among the top results, the feedback model scores <b>Doc#${POS + 1}</b> highest and <b>Doc#${NEG + 1}</b> lowest. They form the <b>context pair</b>: Doc#${POS + 1} is the positive, Doc#${NEG + 1} the negative. Scores are illustrative.`,
      2: `The pair's <b>confidence</b> is the gap between their feedback scores: ${f2(DOCS[POS].f)} − ${f2(DOCS[NEG].f)} = <b>${f2(CONF)}</b>. Two documents the model finds nearly identical would give a confidence near 0, and almost no direction.`,
      3: `For each candidate, <b>delta</b> is its similarity to the positive minus its similarity to the negative: ${CANDS.map((c, i) => `Candidate#${i + 1} ${sg(c.delta)}`).join(', ')}. A positive delta means closer to the positive example.`,
      4: `<b>F = a · score + confidence<sup>b</sup> · c · delta</b>, here with a = b = c = 1. By score alone the order is ${rankBy('q').map((i) => `#${i + 1}`).join(', ')}; with feedback it becomes ${rankBy('F').map((i) => `#${i + 1}`).join(', ')}. Numbers are illustrative.`,
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
