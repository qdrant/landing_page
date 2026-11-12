/*
 * metric island: interactive replacement for goal.png and metric.png.
 *
 * How the abovethreshold@N metric works, in three steps:
 *   1 Retriever ranking:  60 documents ranked by the retriever; the top K form
 *                         the context limit, the initial results available as
 *                         feedback.
 *   2 Feedback scores:    the feedback model scores the same documents. Its
 *                         highest score inside the top K is the threshold, and
 *                         documents outside the top K that exceed it are the
 *                         desired results.
 *   3 abovethreshold@N:   count the desired results in the N positions after
 *                         the top K, for the vanilla retriever and for the
 *                         feedback-based ranking.
 * All scores are illustrative and seeded; the counts are computed from them.
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

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N_DOCS = 60;
const K = 10; // context limit
const N = 10; // window after the top K
const DESIRED_AT = [27, 44];

// Data: retriever scores (descending), feedback scores, formula scores.
const rnd = mulberry32(4);
const r = Array.from({ length: N_DOCS }, (_, i) => 0.92 - 0.5 * Math.pow(i / (N_DOCS - 1), 0.7));
let f = r.map((v) => Math.min(0.78, 0.25 + 0.45 * v + (rnd() - 0.5) * 0.3));
const threshold = Math.max(...f.slice(0, K));
f = f.map((v, i) => (i >= K ? Math.min(v, threshold - 0.04) : v));
DESIRED_AT.forEach((i) => (f[i] = threshold + 0.07));
const desired = new Set(f.map((v, i) => (i >= K && v > threshold ? i : -1)).filter((i) => i >= 0));
// Feedback-based second ranking of everything outside the top K.
const formula = f.map((v, i) => 0.35 * r[i] + 0.65 * v);
const rest = [...Array(N_DOCS).keys()].slice(K).sort((a, b) => formula[b] - formula[a]);
const feedbackOrder = [...Array(K).keys(), ...rest];
const countIn = (order) => order.slice(K, K + N).filter((i) => desired.has(i)).length;
const vanilla = countIn([...Array(N_DOCS).keys()]);
const withFeedback = countIn(feedbackOrder);

const STEPS = [
  { id: 1, label: '1 Retriever ranking' },
  { id: 2, label: '2 Feedback scores' },
  { id: 3, label: '3 Abovethreshold@N' },
];

const WIDE = { VB_W: 760, pitch: 11, bw: 8, x0: 50, h: 96, gap: 66 };
const NARROW = { VB_W: 340, pitch: 5, bw: 3, x0: 20, h: 70, gap: 62 };

export function mount(node) {
  node.classList.add('rf-mt');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    STEPS.map((s) => `<button type="button" class="qi-chip" data-step="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 380" role="img" aria-label="Sixty documents as bars: the retriever ranking, the feedback model scores with the threshold and the desired results, and the abovethreshold@N count for the vanilla and feedback-based rankings.">',
    '    <g class="rf-mt__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 rf-mt__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.rf-mt__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.rf-mt__status');
  const chips = [...node.querySelectorAll('[data-step]')];
  let step = 1;
  const isNarrow = watchNarrow(node, () => render());

  // One strip of bars. values[i] belongs to document order[i].
  function strip(G, y, title, order, values, opts = {}) {
    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: G.x0 - (G === NARROW ? 0 : 40), y: y - 8 }, title));
    const base = y + G.h;
    g.appendChild(el('line', { class: 'qi-axis', x1: G.x0 - 4, y1: base, x2: G.x0 + N_DOCS * G.pitch, y2: base }));
    if (opts.window) {
      const wx = G.x0 + K * G.pitch - 2;
      g.appendChild(el('rect', { class: 'rf-mt__window', x: wx, y: y - 4, width: N * G.pitch + 2, height: G.h + 4, rx: 3 }));
    }
    order.forEach((doc, pos) => {
      const v = values(doc);
      const h = Math.max(2, v * G.h * 1.05);
      let cls = 'rf-mt__bar';
      if (pos < K) cls += ' is-topk';
      if (opts.desired && desired.has(doc)) cls = 'rf-mt__bar is-desired';
      g.appendChild(el('rect', { class: cls, x: G.x0 + pos * G.pitch, y: base - h, width: G.bw, height: h }));
    });
    if (opts.threshold != null) {
      const ty = base - opts.threshold * G.h * 1.05;
      g.appendChild(el('line', { class: 'rf-mt__thr', x1: G.x0 - 4, y1: ty, x2: G.x0 + N_DOCS * G.pitch, y2: ty }));
      g.appendChild(el('text', { class: 'qi-label rf-mt__thrlab', x: G.x0 + N_DOCS * G.pitch, y: ty - 5, 'text-anchor': 'end' }, 'threshold'));
    }
    if (opts.note) g.appendChild(el('text', { class: 'qi-label', x: G.x0 + N_DOCS * G.pitch, y: base + 18, 'text-anchor': 'end' }, opts.note));
    if (opts.legendTopK) g.appendChild(el('text', { class: 'qi-label', x: G.x0, y: base + 18 }, `top ${K}`));
  }

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    g.replaceChildren();
    const inOrder = [...Array(N_DOCS).keys()];
    let y = 34;
    if (step === 1) {
      strip(G, y, 'Retriever ranking, best first', inOrder, (d) => r[d], { legendTopK: true });
      y += G.h + G.gap;
      svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${y - 20}`);
      statusEl.innerHTML = `The retriever ranks ${N_DOCS} documents. The first <b>K = ${K}</b> are the <b>context limit</b>: the only results available to collect feedback from.`;
    } else if (step === 2) {
      strip(G, y, 'Retriever ranking, best first', inOrder, (d) => r[d], { legendTopK: true });
      y += G.h + G.gap;
      strip(G, y, 'Feedback model scores, same documents', inOrder, (d) => f[d], { threshold, desired: true });
      y += G.h + G.gap;
      svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${y - 20}`);
      statusEl.innerHTML = `The feedback model's <b>highest score inside the top ${K}</b> is the threshold. <b>${desired.size}</b> documents outside the top ${K} score above it: the <b>desired results</b>, which the retriever ranked too low.`;
    } else {
      strip(G, y, `Vanilla second retrieval: positions ${K + 1} to ${K + N}`, inOrder, (d) => f[d], { threshold, desired: true, window: true, note: `abovethreshold@${N} = ${vanilla}` });
      y += G.h + G.gap;
      strip(G, y, 'With feedback-based scoring', feedbackOrder, (d) => f[d], { threshold, desired: true, window: true, note: `abovethreshold@${N} = ${withFeedback}` });
      y += G.h + G.gap;
      svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${y - 20}`);
      statusEl.innerHTML = `Counting desired results in the ${N} positions after the top ${K}: the vanilla retriever surfaces <b>${vanilla}</b> of ${desired.size}, feedback-based rescoring surfaces <b>${withFeedback}</b> of ${desired.size}. Scores are illustrative.`;
    }
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
