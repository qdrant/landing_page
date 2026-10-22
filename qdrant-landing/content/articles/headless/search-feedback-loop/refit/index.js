/*
 * refit island: interactive replacement for refit.png.
 *
 * ReFit updates the retriever's query vector in one step:
 *   1 Vector search:  the retriever scores the feedback documents.
 *   2 Cross-encoder:  a cross-encoder scores the same documents.
 *   3 Compare:        both scores become probability distributions, and the
 *                     Kullback-Leibler divergence measures how far apart they are.
 *   4 Update vector:  gradient descent changes the query vector to shrink that
 *                     divergence, and a new vector search follows.
 * The scores and the updated scores are illustrative; the distributions and
 * the divergences are computed from them.
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

const DOCS = [
  { s: 0.82, c: 0.55 },
  { s: 0.74, c: 0.95 },
  { s: 0.7, c: 0.4 },
  { s: 0.66, c: 0.8 },
  { s: 0.5, c: 0.3 },
];
const softmax = (xs, t) => {
  const e = xs.map((x) => Math.exp(x / t));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
};
const kl = (p, q) => p.reduce((a, pi, i) => a + (pi > 0 ? pi * Math.log(pi / q[i]) : 0), 0);
const S0 = DOCS.map((d) => d.s);
const CE = DOCS.map((d) => d.c);
// Illustrative update: the retriever's scores move most of the way to the cross-encoder's.
const S1 = S0.map((s, i) => s + 0.75 * (CE[i] - s));
const P_CE = softmax(CE, 0.15);
const P_S0 = softmax(S0, 0.15);
const P_S1 = softmax(S1, 0.15);
const KL0 = kl(P_CE, P_S0);
const KL1 = kl(P_CE, P_S1);
const VEC0 = [0.2, 0.7, 0.4, 0.9, 0.3, 0.6, 0.1, 0.8];
const VEC1 = [0.35, 0.55, 0.5, 0.75, 0.2, 0.65, 0.25, 0.7];

const STEPS = [
  { id: 1, label: '1 Vector search' },
  { id: 2, label: '2 Cross-encoder' },
  { id: 3, label: '3 Compare (KL)' },
  { id: 4, label: '4 Update vector' },
];

const WIDE = { VB_W: 760, VB_H: 330, bw: 300 };
const NARROW = { VB_W: 340, VB_H: 470, bw: 150 };

export function mount(node) {
  node.classList.add('sf-rf');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    STEPS.map((s) => `<button type="button" class="qi-chip" data-step="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 330" role="img" aria-label="ReFit: a vector search and a cross-encoder score the same documents, the difference between their score distributions is measured, and the query vector is updated to reduce it.">',
    '    <g class="sf-rf__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 sf-rf__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.sf-rf__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.sf-rf__status');
  const chips = [...node.querySelectorAll('[data-step]')];
  let step = 1;
  const isNarrow = watchNarrow(node, () => render());
  const f2 = (v) => v.toFixed(2);

  const txt = (x, y, t, cls = '', anchor = 'start') => g.appendChild(el('text', { class: `qi-label ${cls}`, x, y, 'text-anchor': anchor }, t));
  const bar = (x, y, w, h, cls) => g.appendChild(el('rect', { class: `sf-rf__bar ${cls}`, x, y, width: Math.max(2, w), height: h, rx: 3 }));

  function rows(G, x0, y0, defs) {
    // defs: [{ vals, cls, label, max }]
    const pitch = defs.length * 20 + 18;
    DOCS.forEach((_, i) => {
      const y = y0 + i * pitch;
      txt(x0, y + 14 + (defs.length - 1) * 10, `Doc ${i + 1}`, 'qi-label--strong');
      defs.forEach((d, k) => {
        const bx = x0 + 52;
        const w = (d.vals[i] / d.max) * G.bw;
        bar(bx, y + k * 20, w, 16, d.cls);
        txt(bx + w + 6, y + k * 20 + 13, d.fmt(d.vals[i]));
      });
    });
    return y0 + DOCS.length * pitch;
  }
  const legend = (x, y, items) => items.forEach((it, i) => {
    bar(x + i * (it.dx || 170), y - 11, 14, 12, it.cls);
    txt(x + i * (it.dx || 170) + 20, y, it.t);
  });

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    const fmtS = (v) => f2(v);
    const fmtP = (v) => `${Math.round(v * 100)}%`;
    const x0 = 10;
    if (step === 1) {
      txt(x0, 22, 'Retriever scores for the feedback documents', 'qi-label--strong');
      rows(G, x0, 44, [{ vals: S0, cls: 'sf-rf__bar--s', max: 1, fmt: fmtS }]);
    } else if (step === 2) {
      txt(x0, 22, 'Same documents, scored by a cross-encoder', 'qi-label--strong');
      legend(x0, 44, [{ cls: 'sf-rf__bar--s', t: 'retriever', dx: narrow ? 100 : 130 }, { cls: 'sf-rf__bar--c', t: 'cross-encoder' }]);
      rows(G, x0, 62, [{ vals: S0, cls: 'sf-rf__bar--s', max: 1, fmt: fmtS }, { vals: CE, cls: 'sf-rf__bar--c', max: 1, fmt: fmtS }]);
    } else if (step === 3) {
      txt(x0, 22, 'Scores as probability distributions', 'qi-label--strong');
      legend(x0, 44, [{ cls: 'sf-rf__bar--s', t: 'retriever', dx: narrow ? 100 : 130 }, { cls: 'sf-rf__bar--c', t: 'cross-encoder' }]);
      const end = rows(G, x0, 62, [{ vals: P_S0, cls: 'sf-rf__bar--s', max: 0.7, fmt: fmtP }, { vals: P_CE, cls: 'sf-rf__bar--c', max: 0.7, fmt: fmtP }]);
      txt(x0, end + 14, `KL divergence: ${f2(KL0)}`, 'sf-rf__kl');
    } else {
      txt(x0, 22, narrow ? 'Query vector, before and after' : 'Query vector, before and after one update', 'qi-label--strong');
      const cw = narrow ? 36 : 44;
      [VEC0, VEC1].forEach((v, k) => {
        const y = 38 + k * 44;
        txt(x0, y + 20, k ? 'after' : 'before', '');
        v.forEach((val, i) => {
          g.appendChild(el('rect', { class: `sf-rf__cell${k ? ' is-new' : ''}`, x: x0 + 56 + i * (cw - (narrow ? 2 : 4)), y, width: cw - (narrow ? 4 : 6), height: 30, rx: 3, style: `fill-opacity:${0.15 + 0.7 * val}` }));
        });
      });
      txt(x0, 148, narrow ? 'New search vs cross-encoder' : 'New vector search, against the cross-encoder', 'qi-label--strong');
      legend(x0, 168, [{ cls: 'sf-rf__bar--s', t: 'retriever', dx: narrow ? 100 : 130 }, { cls: 'sf-rf__bar--c', t: 'cross-encoder' }]);
      const end = rows(G, x0, 184, [{ vals: P_S1, cls: 'sf-rf__bar--s', max: 0.7, fmt: fmtP }, { vals: P_CE, cls: 'sf-rf__bar--c', max: 0.7, fmt: fmtP }]);
      txt(x0, end + 14, `KL divergence: ${f2(KL0)} → ${f2(KL1)}`, 'sf-rf__kl');
      svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${end + 30}`);
    }
    if (step < 4) {
      const last = step === 1 ? 44 + 5 * 38 : step === 2 ? 62 + 5 * 58 : 62 + 5 * 58 + 30;
      svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${last + 8}`);
    }
    statusEl.innerHTML = {
      1: 'The retriever scores the feedback documents with its query vector.',
      2: 'A <b>cross-encoder</b> scores the same documents. It reads query and document together, so it is slower but usually a better judge of relevance, and it disagrees with the retriever here.',
      3: `Both sets of scores become probability distributions, and the <b>Kullback–Leibler divergence</b> measures how far the retriever's is from the cross-encoder's: <b>${f2(KL0)}</b>.`,
      4: `<b>Gradient descent</b> changes the query vector to shrink that divergence. After the update, a new vector search matches the cross-encoder much more closely: KL <b>${f2(KL0)} → ${f2(KL1)}</b>. The updated scores are illustrative.`,
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
