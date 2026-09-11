/*
 * asymmetric island — interactive replacement for asymmetric-quantization.png.
 *
 * Illustrates asymmetric quantization. Each panel shows the stored vector
 * (binary in both) and the query (binary on the left, scalar-quantized 8-bit
 * on the right), then a small scatter: one dot per dimension at (exact float32
 * contribution, estimated contribution). The diagonal is perfect agreement and
 * the vertical distance to it is the error. With a binary query every estimate
 * is the same ±1 vote, so the dots collapse onto two horizontal lines and the
 * query magnitude is lost; with a scalar query they follow the diagonal. "New
 * vectors" draws a fresh pair; hover a dimension (cell or dot) for its numbers.
 *
 * Pure SVG + CSS: chrome colors switch on the host theme via CSS custom
 * properties; the sign hues are constant.
 */

const NS = 'http://www.w3.org/2000/svg';

const D = 16; // dimensions
const QUERY_BITS = 8;
const NEAR_ZERO = 0.25; // |q| below this counts as a near-zero query component

// Geometry (viewBox 800 x 300). Two panels of D cells each.
const VB_W = 800;
const VB_H = 300;
const CELL = 20;
const PITCH = 24;
const ROW_W = D * PITCH - (PITCH - CELL); // 380
const PANELS = [
  { id: 'bin', x: 2, title: 'Binary × Binary', queryLabel: 'Query · 1 bit / dim' },
  { id: 'asym', x: 418, title: 'Binary (stored) × Scalar (query)', queryLabel: `Query · ${QUERY_BITS} bit / dim` },
];
const ROWS = { stored: 42, query: 90 };
const PLOT = { dx: 0, y: 142, w: ROW_W, h: 156 }; // scatter box: full panel width
const PAD = 9; // inset of the data area inside the box, so edge (clamped) dots stay inside
const MIN_ALPHA = 0.12; // saturation floor so a near-zero cell stays visible

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
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

function gaussian(rnd) {
  const u = Math.max(rnd(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

function sign(v) {
  return v > 0 ? 1 : -1;
}

function mean(a) {
  return a.reduce((s, v) => s + v, 0) / a.length;
}

// Scalar-quantize the query to QUERY_BITS levels over [-max|q|, max|q|],
// mirroring Qdrant's asymmetric query encoding.
function quantizeQuery(q) {
  const m = Math.max(...q.map(Math.abs)) || 1;
  const levels = (1 << QUERY_BITS) - 1;
  return q.map((v) => (Math.round(((v + m) / (2 * m)) * levels) / levels) * 2 * m - m);
}

// Paint a cell: hue by sign (blue positive, orange negative), saturation by
// |v| relative to `scale` (clamped).
function paint(rect, v, scale) {
  rect.classList.toggle('is-neg', v < 0);
  const t = Math.min(1, Math.abs(v) / (scale || 1));
  rect.setAttribute('fill-opacity', (MIN_ALPHA + (1 - MIN_ALPHA) * t).toFixed(3));
}

function fmt(v, digits = 2) {
  return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(digits);
}

export function mount(node) {
  node.classList.add('qi-aq');

  node.innerHTML = [
    '<div class="qi-aq__fig">',
    '  <div class="qi-aq__controls">',
    '    <span class="qi-aq__hint">Hover a dimension, cell or dot, to see its numbers.</span>',
    '    <button type="button" class="qi-aq__btn qi-aq__shuffle">',
    '      <svg class="qi-aq__btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>New vectors',
    '    </button>',
    '  </div>',
    `  <svg class="qi-aq__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="Two panels scoring a binary stored vector against a query, with a binary query on the left and a scalar-quantized query on the right. Each panel shows the stored vector, the query, and a scatter of estimated against exact per-dimension contributions.">',
    PANELS.map((p) => {
      const px = p.x + PLOT.dx;
      return [
        `<g class="qi-aq__panel" data-panel="${p.id}">`,
        `  <text class="qi-aq__title" x="${p.x}" y="16">${p.title}</text>`,
        `  <text class="qi-aq__label" x="${p.x}" y="${ROWS.stored - 6}">Stored vector · 1 bit / dim</text>`,
        `  <g class="qi-aq__row qi-aq__row--stored"></g>`,
        `  <text class="qi-aq__label" x="${p.x}" y="${ROWS.query - 6}"><tspan class="qi-aq__op">×</tspan> ${p.queryLabel}</text>`,
        `  <g class="qi-aq__row qi-aq__row--query"></g>`,
        `  <text class="qi-aq__label" x="${p.x}" y="${PLOT.y - 8}"><tspan class="qi-aq__op">=</tspan> Estimated vs exact contribution</text>`,
        // Scatter box with the identity diagonal; dots are added per dimension.
        `  <rect class="qi-aq__plot" x="${px}" y="${PLOT.y}" width="${PLOT.w}" height="${PLOT.h}" rx="4"/>`,
        `  <line class="qi-aq__diag" x1="${px + PAD}" y1="${PLOT.y + PLOT.h - PAD}" x2="${px + PLOT.w - PAD}" y2="${PLOT.y + PAD}"/>`,
        `  <g class="qi-aq__dots"></g>`,
        `  <text class="qi-aq__gap" x="${px + PLOT.w - 8}" y="${PLOT.y + PLOT.h - 8}" text-anchor="end"></text>`,
        '</g>',
      ].join('');
    }).join(''),
    '  </svg>',
    '  <p class="qi-aq__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-aq__svg');
  const statusEl = node.querySelector('.qi-aq__status');
  const shuffleBtn = node.querySelector('.qi-aq__shuffle');

  const panelEls = PANELS.map((p) => {
    const g = node.querySelector(`[data-panel="${p.id}"]`);
    const rows = {};
    ['stored', 'query'].forEach((r) => {
      const rowG = g.querySelector(`.qi-aq__row--${r}`);
      rows[r] = [];
      for (let i = 0; i < D; i++) {
        const rect = el('rect', { class: 'qi-aq__cell', x: p.x + i * PITCH, y: ROWS[r], width: CELL, height: CELL, rx: 3, 'data-index': i });
        rows[r].push(rect);
        rowG.appendChild(rect);
      }
    });
    // Scatter: an error segment (dot to diagonal) behind each dot.
    const dotsG = g.querySelector('.qi-aq__dots');
    const errs = [];
    const dots = [];
    for (let i = 0; i < D; i++) {
      const e = el('line', { class: 'qi-aq__err', x1: 0, y1: 0, x2: 0, y2: 0 });
      errs.push(e);
      dotsG.appendChild(e);
    }
    for (let i = 0; i < D; i++) {
      const d = el('circle', { class: 'qi-aq__dot', cx: 0, cy: 0, r: 4.5, 'data-index': i });
      dots.push(d);
      dotsG.appendChild(d);
    }
    return { ...p, rows, errs, dots, gap: g.querySelector('.qi-aq__gap') };
  });

  let rnd = mulberry32(4242);
  let stored = [];
  let query = [];
  let qScalar = [];
  let contrib = { exact: [], bin: [], asym: [] };
  let hovered = null;

  function regenerate() {
    // A query and a stored vector that is a plausible neighbour of it.
    query = [];
    for (let i = 0; i < D; i++) query.push(gaussian(rnd));
    const a = 0.45 + rnd() * 0.35;
    stored = query.map((v) => a * v + (1 - a) * gaussian(rnd));
    qScalar = quantizeQuery(query);

    // Per-dimension contributions. Both estimates drop |stored|, so they are
    // scaled by its mean magnitude; the binary query also drops |query| and is
    // scaled by that mean too. This keeps the three on one comparable scale.
    const cs = mean(stored.map(Math.abs));
    const cq = mean(qScalar.map(Math.abs));
    contrib = {
      exact: stored.map((s, i) => s * query[i]),
      asym: stored.map((s, i) => sign(s) * qScalar[i] * cs),
      bin: stored.map((s, i) => sign(s) * sign(query[i]) * cs * cq),
    };
  }

  function render() {
    const qMax = Math.max(...qScalar.map(Math.abs)) || 1;
    // Axis range from the estimates, shared by both panels; a heavy-tailed
    // exact value just clamps to the edge of the box.
    const m = 1.15 * (Math.max(...[...contrib.bin, ...contrib.asym].map(Math.abs)) || 1);
    const clamp = (v) => Math.max(-m, Math.min(m, v));

    panelEls.forEach((p) => {
      const est = contrib[p.id];
      const px = p.x + PLOT.dx;
      const xOf = (v) => px + PAD + ((clamp(v) + m) / (2 * m)) * (PLOT.w - 2 * PAD);
      const yOf = (v) => PLOT.y + PLOT.h - PAD - ((clamp(v) + m) / (2 * m)) * (PLOT.h - 2 * PAD);
      for (let i = 0; i < D; i++) {
        paint(p.rows.stored[i], sign(stored[i]), 1);
        if (p.id === 'bin') paint(p.rows.query[i], sign(query[i]), 1);
        else paint(p.rows.query[i], qScalar[i], qMax);

        const ex = contrib.exact[i];
        const x = xOf(ex);
        const y = yOf(est[i]);
        p.dots[i].setAttribute('cx', x);
        p.dots[i].setAttribute('cy', y);
        p.dots[i].classList.toggle('is-neg', est[i] < 0);
        // Error: vertical segment from the dot to the diagonal (where estimate = exact).
        p.errs[i].setAttribute('x1', x);
        p.errs[i].setAttribute('x2', x);
        p.errs[i].setAttribute('y1', y);
        p.errs[i].setAttribute('y2', yOf(ex));
      }
      const gap = mean(est.map((v, i) => Math.abs(v - contrib.exact[i])));
      p.gap.textContent = `avg error ${gap.toFixed(2)}`;
    });
  }

  function renderHighlight() {
    panelEls.forEach((p) => {
      ['stored', 'query'].forEach((r) => p.rows[r].forEach((rect, i) => rect.classList.toggle('is-hot', i === hovered)));
      p.dots.forEach((d, i) => d.classList.toggle('is-hot', i === hovered));
      p.errs.forEach((e, i) => e.classList.toggle('is-hot', i === hovered));
    });

    if (hovered == null) {
      const small = qScalar.filter((v) => Math.abs(v) < NEAR_ZERO).length;
      statusEl.innerHTML =
        `A dot on the diagonal is a perfect estimate. Binary gives every dimension the same ±1 vote, ` +
        `even the <b>${small}</b> near-zero ones; scalar weights each by its magnitude.`;
      return;
    }

    const i = hovered;
    const s = stored[i];
    statusEl.innerHTML =
      `Dimension ${i + 1}: stored <b>${fmt(s)}</b> → <b>${fmt(sign(s), 0)}</b>, query <b>${fmt(query[i])}</b>. ` +
      `Contribution: exact <b>${fmt(contrib.exact[i])}</b>, binary query <b>${fmt(contrib.bin[i])}</b>, scalar query <b>${fmt(contrib.asym[i])}</b>.`;
  }

  shuffleBtn.addEventListener('click', () => {
    regenerate();
    hovered = null;
    render();
    renderHighlight();
  });

  function indexFromEvent(e) {
    const t = e.target.closest ? e.target.closest('[data-index]') : null;
    return t ? Number(t.getAttribute('data-index')) : null;
  }
  svg.addEventListener('pointerover', (e) => {
    const i = indexFromEvent(e);
    if (i != null && i !== hovered) {
      hovered = i;
      renderHighlight();
    }
  });
  svg.addEventListener('pointerout', (e) => {
    if (indexFromEvent(e) != null) {
      hovered = null;
      renderHighlight();
    }
  });

  regenerate();
  render();
  renderHighlight();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
