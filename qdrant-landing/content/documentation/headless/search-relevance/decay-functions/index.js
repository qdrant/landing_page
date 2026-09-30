/*
 * decay-functions island: interactive replacement for decay-function.png.
 *
 * Plots one of Qdrant's three decay functions over x, with the three parameters
 * as draggable handles:
 *   - target    on the x axis: where the score peaks at 1
 *   - midpoint  on the score axis: the score reached at target +/- scale
 *   - scale     on the midpoint line: how far from target that happens
 *
 * All three formulas pass through (target +/- scale, midpoint), so the scale
 * handle always sits on the curve. Switching functions changes the shape while
 * the curve keeps running through that handle, which is the point the parameter
 * table is making. Pure SVG + CSS on the shared island design system
 * (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 360).
const PX0 = 110; // score axis; the left margin holds the midpoint measure
const MID_ARROW_X = PX0 - 24; // the midpoint span, outside the axis
const MID_LABEL_X = PX0 - 30;
const PX1 = 728; // right edge of the plotted domain
const PY_TOP = 44; // score = 1
const PY0 = 300; // score = 0, the x axis
const XMAX = 10;

const SAMPLES = 240;
const TARGET_MIN = 0.4; // keeps the handle clear of the score axis
const SCALE_MIN = 0.4;
const MID_MIN = 0.05; // the formulas need midpoint in (0, 1), exclusive
const MID_MAX = 0.95;
const TARGET_ARROW_Y = PY0 + 22; // the target span, below the x axis
const TARGET_LABEL_Y = PY0 + 44;
const ARROW_MIN = 26; // below this a span is all arrowhead, so hide it
const LABEL_MIN = 58; // and below this its label no longer fits

const DEFAULTS = { target: 4, scale: 2, midpoint: 0.5 };
const DEFAULT_FN = 'gauss';

const FNS = [
  {
    id: 'lin',
    label: 'Linear',
    name: 'lin_decay',
    at: (x, t, s, m) => Math.max(0, (-(1 - m) / s) * Math.abs(x - t) + 1),
  },
  {
    id: 'exp',
    label: 'Exponential',
    name: 'exp_decay',
    at: (x, t, s, m) => Math.exp((Math.log(m) / s) * Math.abs(x - t)),
  },
  {
    id: 'gauss',
    label: 'Gaussian',
    name: 'gauss_decay',
    at: (x, t, s, m) => Math.exp((Math.log(m) / (s * s)) * (x - t) ** 2),
  },
];

const HANDLES = [
  { id: 'target', label: 'target', orient: 'horizontal' },
  { id: 'midpoint', label: 'midpoint', orient: 'vertical' },
  { id: 'scale', label: 'scale', orient: 'horizontal' },
];

const xOf = (v) => PX0 + (v / XMAX) * (PX1 - PX0);
const vOfX = (px) => ((px - PX0) / (PX1 - PX0)) * XMAX;
const yOf = (s) => PY0 - s * (PY0 - PY_TOP);
const sOfY = (py) => (PY0 - py) / (PY0 - PY_TOP);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

export function mount(node) {
  node.classList.add('qi-dk');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group">',
    FNS.map(
      (f) => `<button type="button" class="qi-chip" data-fn="${f.id}" aria-pressed="false">${f.label}</button>`,
    ).join(''),
    '    </div>',
    '    <button type="button" class="qi-chip" data-reset hidden>',
    '      <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset',
    '    </button>',
    '  </div>',
    '  <svg class="qi-svg qi-dk__svg" viewBox="0 0 760 360" role="img"',
    '    aria-label="A decay curve plotted against x. The score peaks at 1 where x equals target, and falls to the midpoint value at target plus or minus scale.">',
    '    <defs>',
    // A marker per pair: markers do not inherit the referencing line's stroke,
    // so each colour needs its own arrowhead.
    HANDLES.map(
      (h) =>
        `      <marker id="qi-dk-arrow-${h.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
        `<path class="qi-dk__arrowhead qi-dk__arrowhead--${h.id}" d="M 0 0 L 10 5 L 0 10 z"/></marker>`,
    ).join(''),
    '    </defs>',
    // Axes and their fixed labels.
    `    <line class="qi-axis" x1="${PX0 - 8}" y1="${PY0}" x2="${PX1 + 14}" y2="${PY0}"/>`,
    `    <line class="qi-axis" x1="${PX0}" y1="${PY_TOP - 20}" x2="${PX0}" y2="${PY0 + 8}"/>`,
    `    <line class="qi-axis qi-dk__tick" x1="${PX0 - 5}" y1="${yOf(1)}" x2="${PX0}" y2="${yOf(1)}"/>`,
    `    <text class="qi-label" x="${PX0 - 10}" y="${yOf(1) + 4}" text-anchor="end">1</text>`,
    `    <text class="qi-label" x="${PX0 - 10}" y="${PY0 + 16}" text-anchor="end">0</text>`,
    `    <text class="qi-label" x="${PX1 + 20}" y="${PY0 + 5}">x</text>`,
    `    <text class="qi-label" x="${PX0}" y="${PY_TOP - 28}" text-anchor="middle">score</text>`,
    // Guides. The midpoint line runs from the score axis to the target line, and
    // the scale arrow continues it out to the scale handle, so together they read
    // as one level line at `midpoint`.
    '    <line class="qi-dk__guide qi-dk__mid-line"/>',
    '    <line class="qi-dk__guide qi-dk__guide--midpoint qi-dk__mid-arrow" marker-start="url(#qi-dk-arrow-midpoint)" marker-end="url(#qi-dk-arrow-midpoint)"/>',
    '    <line class="qi-dk__guide qi-dk__guide--scale qi-dk__scale-arrow" marker-start="url(#qi-dk-arrow-scale)" marker-end="url(#qi-dk-arrow-scale)"/>',
    '    <line class="qi-dk__guide qi-dk__target-line"/>',
    '    <line class="qi-dk__guide qi-dk__guide--target qi-dk__target-arrow" marker-start="url(#qi-dk-arrow-target)" marker-end="url(#qi-dk-arrow-target)"/>',
    '    <text class="qi-label qi-dk__label--midpoint qi-dk__mid-label" text-anchor="end">midpoint</text>',
    '    <text class="qi-label qi-dk__label--scale qi-dk__scale-label" text-anchor="middle">scale</text>',
    '    <text class="qi-label qi-dk__label--target qi-dk__target-label" text-anchor="middle">target</text>',
    // The curve, then the handles on top of it.
    '    <polyline class="qi-dk__curve"/>',
    HANDLES.map(
      (h) =>
        `    <g class="qi-dk__handle qi-dk__handle--${h.id}" data-handle="${h.id}" tabindex="0" role="slider"` +
        ` aria-orientation="${h.orient}" aria-label="${h.label}">` +
        '      <circle class="qi-dk__hit" r="13"/><circle class="qi-dk__knob" r="6.5"/>' +
        '    </g>',
    ).join(''),
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-dk__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-dk__svg');
  const curve = node.querySelector('.qi-dk__curve');
  const midLine = node.querySelector('.qi-dk__mid-line');
  const midArrow = node.querySelector('.qi-dk__mid-arrow');
  const scaleArrow = node.querySelector('.qi-dk__scale-arrow');
  const targetLine = node.querySelector('.qi-dk__target-line');
  const targetArrow = node.querySelector('.qi-dk__target-arrow');
  const midLabel = node.querySelector('.qi-dk__mid-label');
  const scaleLabel = node.querySelector('.qi-dk__scale-label');
  const targetLabel = node.querySelector('.qi-dk__target-label');
  const statusEl = node.querySelector('.qi-dk__status');
  const resetBtn = node.querySelector('[data-reset]');
  const fnBtns = [...node.querySelectorAll('[data-fn]')];

  const state = { fn: DEFAULT_FN, ...DEFAULTS };
  const fnOf = () => FNS.find((f) => f.id === state.fn);

  /* Per-handle behaviour. `read`/`write` are in parameter units; `from` maps a
     point in viewBox space onto this handle's parameter; `pos` is the inverse. */
  const SPEC = {
    target: {
      read: () => state.target,
      write: (v) => (state.target = clamp(v, TARGET_MIN, XMAX - state.scale)),
      min: () => TARGET_MIN,
      max: () => XMAX - state.scale,
      step: 0.25,
      from: (p) => vOfX(p.x),
      pos: () => [xOf(state.target), PY0],
    },
    midpoint: {
      read: () => state.midpoint,
      write: (v) => (state.midpoint = clamp(v, MID_MIN, MID_MAX)),
      min: () => MID_MIN,
      max: () => MID_MAX,
      step: 0.05,
      from: (p) => sOfY(p.y),
      pos: () => [PX0, yOf(state.midpoint)],
    },
    scale: {
      read: () => state.scale,
      write: (v) => (state.scale = clamp(v, SCALE_MIN, XMAX - state.target)),
      min: () => SCALE_MIN,
      max: () => XMAX - state.target,
      step: 0.25,
      from: (p) => vOfX(p.x) - state.target,
      pos: () => [xOf(state.target + state.scale), yOf(state.midpoint)],
    },
  };

  const handles = HANDLES.map((h) => ({ ...h, ...SPEC[h.id], g: node.querySelector(`[data-handle="${h.id}"]`) }));

  function curvePoints() {
    const { at } = fnOf();
    const { target: t, scale: s, midpoint: m } = state;
    const xs = [];
    for (let i = 0; i <= SAMPLES; i++) xs.push((i / SAMPLES) * XMAX);
    if (state.fn === 'lin') {
      // Pin the exact zero crossings so the kink stays sharp between samples.
      const half = s / (1 - m);
      [t - half, t + half].forEach((v) => {
        if (v > 0 && v < XMAX) xs.push(v);
      });
      xs.sort((a, b) => a - b);
    }
    return xs.map((x) => `${xOf(x).toFixed(1)},${yOf(at(x, t, s, m)).toFixed(1)}`).join(' ');
  }

  function render() {
    const { target: t, scale: s, midpoint: m } = state;
    const fn = fnOf();
    const xt = xOf(t);
    const xs = xOf(t + s);
    const ym = yOf(m);

    fnBtns.forEach((b) => {
      const on = b.dataset.fn === state.fn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    resetBtn.hidden = t === DEFAULTS.target && s === DEFAULTS.scale && m === DEFAULTS.midpoint;

    curve.setAttribute('points', curvePoints());

    midLine.setAttribute('x1', PX0);
    midLine.setAttribute('y1', ym);
    midLine.setAttribute('x2', xt);
    midLine.setAttribute('y2', ym);

    // Stop the arrow short of the knob at each end, or the handle covers the
    // arrowhead and the span stops reading as a measurement.
    scaleArrow.setAttribute('x1', xt + 2);
    scaleArrow.setAttribute('y1', ym);
    scaleArrow.setAttribute('x2', Math.max(xt + 4, xs - 10));
    scaleArrow.setAttribute('y2', ym);
    scaleArrow.style.display = xs - xt < ARROW_MIN ? 'none' : '';

    targetLine.setAttribute('x1', xt);
    targetLine.setAttribute('y1', PY0);
    targetLine.setAttribute('x2', xt);
    targetLine.setAttribute('y2', yOf(1));

    targetArrow.setAttribute('x1', PX0);
    targetArrow.setAttribute('y1', TARGET_ARROW_Y);
    targetArrow.setAttribute('x2', xt);
    targetArrow.setAttribute('y2', TARGET_ARROW_Y);
    targetArrow.style.display = xt - PX0 < ARROW_MIN ? 'none' : '';

    midArrow.setAttribute('x1', MID_ARROW_X);
    midArrow.setAttribute('y1', PY0);
    midArrow.setAttribute('x2', MID_ARROW_X);
    midArrow.setAttribute('y2', ym);

    midLabel.setAttribute('x', MID_LABEL_X);
    midLabel.setAttribute('y', (PY0 + ym) / 2 + 4);
    scaleLabel.setAttribute('x', (xt + xs) / 2);
    scaleLabel.setAttribute('y', ym - 9);
    scaleLabel.style.display = xs - xt < LABEL_MIN ? 'none' : '';
    targetLabel.setAttribute('x', (PX0 + xt) / 2);
    targetLabel.setAttribute('y', TARGET_LABEL_Y);
    targetLabel.style.display = xt - PX0 < LABEL_MIN ? 'none' : '';

    handles.forEach((h) => {
      const [x, y] = h.pos();
      h.g.setAttribute('transform', `translate(${x} ${y})`);
      h.g.setAttribute('aria-valuemin', f2(h.min()));
      h.g.setAttribute('aria-valuemax', f2(h.max()));
      h.g.setAttribute('aria-valuenow', f2(h.read()));
      h.g.setAttribute('aria-valuetext', `${h.label} ${h.id === 'midpoint' ? f2(h.read()) : f1(h.read())}`);
    });

    const crossings = [t - s, t + s].filter((v) => v >= 0 && v <= XMAX).map(f1);
    statusEl.innerHTML =
      `<code>${fn.name}</code>: target ${f1(t)}, scale ${f1(s)}, midpoint ${f2(m)}. ` +
      `Score is ${f2(m)} at x = ${crossings.join(' and ')}.`;
  }

  /* Pointer position in viewBox units. Going through the screen CTM keeps the
     mapping right at any rendered width, and under any page zoom. */
  function toLocal(event) {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
  }

  handles.forEach((h) => {
    h.g.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      // Capture keeps the drag alive outside the handle, but it throws if the
      // pointer is no longer active. Losing it must not abort the drag.
      try {
        h.g.setPointerCapture(event.pointerId);
      } catch (_) {}
      h.g.classList.add('is-dragging');
      h.drag = event.pointerId;
      h.g.focus();
    });
    h.g.addEventListener('pointermove', (event) => {
      if (h.drag !== event.pointerId) return;
      const p = toLocal(event);
      if (!p) return;
      h.write(h.from(p));
      render();
    });
    const end = (event) => {
      if (h.drag !== event.pointerId) return;
      h.drag = null;
      h.g.classList.remove('is-dragging');
    };
    h.g.addEventListener('pointerup', end);
    h.g.addEventListener('pointercancel', end);
    h.g.addEventListener('lostpointercapture', end);

    h.g.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = h.read() + h.step;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = h.read() - h.step;
      else if (event.key === 'Home') next = h.min();
      else if (event.key === 'End') next = h.max();
      if (next === null) return;
      event.preventDefault();
      h.write(next);
      render();
    });
  });

  fnBtns.forEach((b) =>
    b.addEventListener('click', () => {
      state.fn = b.dataset.fn;
      render();
    }),
  );
  resetBtn.addEventListener('click', () => {
    Object.assign(state, DEFAULTS);
    render();
  });

  render();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
