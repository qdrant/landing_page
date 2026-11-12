/*
 * renorm island: interactive replacement for length-renormalization.svg.
 *
 * In 2D: quantizing a vector x gives x-hat, which is usually shorter and points
 * slightly elsewhere. Rescaling x-hat by |x| / |x-hat| puts it back on the circle
 * of radius |x|, which shrinks the error. Step through the three stages. The
 * angles and lengths are illustrative; the errors are computed from them.
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
  node.classList.toggle('tq-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('tq-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

const ANG_X = 52; // degrees
const ANG_Q = 38;
const LEN_Q = 0.55; // |x-hat| relative to |x|
const STEPS = [
  { id: 1, label: '1 Original' },
  { id: 2, label: '2 Quantize' },
  { id: 3, label: '3 Renormalize' },
];

const WIDE = { VB_W: 760, VB_H: 380, ox: 90, oy: 350, R: 300 };
const NARROW = { VB_W: 340, VB_H: 330, ox: 30, oy: 300, R: 270 };
const rad = (d) => (d * Math.PI) / 180;

export function mount(node) {
  node.classList.add('tq-rn');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    STEPS.map((s) => `<button type="button" class="qi-chip" data-step="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 380" role="img" aria-label="A vector, its shorter quantized version, and the quantized vector rescaled back to the original length.">',
    '    <g class="tq-rn__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 tq-rn__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.tq-rn__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.tq-rn__status');
  const chips = [...node.querySelectorAll('[data-step]')];
  let step = 1;
  const isNarrow = watchNarrow(node, () => render());

  // Errors, relative to |x| = 1.
  const xv = [Math.cos(rad(ANG_X)), Math.sin(rad(ANG_X))];
  const qv = [LEN_Q * Math.cos(rad(ANG_Q)), LEN_Q * Math.sin(rad(ANG_Q))];
  const rv = [Math.cos(rad(ANG_Q)), Math.sin(rad(ANG_Q))]; // x-hat scaled to length 1
  const err = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const E2 = err(xv, qv);
  const E3 = err(xv, rv);

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    const P = (v) => [G.ox + v[0] * G.R, G.oy - v[1] * G.R];
    const o = [G.ox, G.oy];
    const line = (a, b, cls) => g.appendChild(el('line', { class: cls, x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
    const dot = (a, cls, r = 5) => g.appendChild(el('circle', { class: cls, cx: a[0], cy: a[1], r }));
    const txt = (a, dx, dy, t, cls = '') => g.appendChild(el('text', { class: `qi-label ${cls}`, x: a[0] + dx, y: a[1] + dy }, t));

    // Axes and the circle of radius |x|.
    line(o, [G.ox + G.R + 30, G.oy], 'tq-rn__axis');
    line(o, [G.ox, G.oy - G.R - 24], 'tq-rn__axis');
    const arcEnd = [G.ox, G.oy - G.R];
    const arcStart = [G.ox + G.R, G.oy];
    g.appendChild(el('path', { class: 'tq-rn__arc', d: `M${arcStart[0]} ${arcStart[1]} A${G.R} ${G.R} 0 0 0 ${arcEnd[0]} ${arcEnd[1]}` }));
    txt([G.ox + G.R, G.oy], -8, 20, '|x|', 'tq-rn__arclab');

    const px = P(xv);
    line(o, px, 'tq-rn__x');
    dot(px, 'tq-rn__xd');
    txt(px, 10, -8, 'x', 'tq-rn__xlab');
    dot(o, 'tq-rn__origin', 3);

    if (step >= 2) {
      const pq = P(qv);
      line(o, pq, 'tq-rn__q');
      dot(pq, 'tq-rn__qd');
      line(px, pq, 'tq-rn__err');
      txt(pq, 10, 20, 'x quantized', 'tq-rn__qlab');
    }
    if (step >= 3) {
      const pr = P(rv);
      line(o, pr, 'tq-rn__r');
      dot(pr, 'tq-rn__rd');
      line(px, pr, 'tq-rn__err is-small');
      txt(pr, 14, 4, narrow ? 'rescaled' : 'ratio · x quantized', 'tq-rn__rlab');
    }

    statusEl.innerHTML = {
      1: 'The vector <b>x</b> has some length |x|, the radius of the dashed circle.',
      2: `Quantizing gives <b>x quantized</b>, which is shorter than x and points slightly elsewhere. Its error against x is <b>${(E2 * 100).toFixed(0)}%</b> of |x|.`,
      3: `Scaling x quantized by <b>ratio = |x| / |x quantized|</b> puts it back on the circle. The angular error stays, but the length error goes: the error against x drops from ${(E2 * 100).toFixed(0)}% to <b>${(E3 * 100).toFixed(0)}%</b> of |x|. Angles and lengths are illustrative.`,
    }[step];
  }

  function setStep(n) {
    step = n;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === step)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setStep(Number(b.dataset.step))));

  setStep(3);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
