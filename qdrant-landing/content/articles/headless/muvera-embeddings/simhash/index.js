/*
 * simhash island: interactive replacement for simhash-space-partitioning.png
 * and simhash-cluster-assignment.png.
 *
 * k_sim random hyperplanes (lines through the origin in this 2D illustration)
 * each give one bit per token vector: which side of the hyperplane it is on.
 * The bits, read together, are the cluster ID. Choose k_sim to see the plane
 * split into regions and the token vectors fall into the 2^k_sim cells on the
 * right; hover or click a token, a region, or a cell to trace it.
 *
 * The hyperplanes and the 12 token vectors are illustrative and seeded, not
 * taken from a real model. A 2D plane cut by k lines through the origin makes
 * only 2k wedges, so some codes stay empty here; in hundreds of dimensions all
 * 2^k_sim codes occur.
 */

const NS = 'http://www.w3.org/2000/svg';

const PS = 300; // plane side
const HALF = PS / 2;
const PY = 22;
// Desktop: plane on the left, cluster cells on the right. Narrow: stacked.
const WIDE = { VB_W: 760, VB_H: 340, PX: 34, SX: 390, SW: 360, STRIP_Y: 122, STRIP_H: 84, CELL_MAX: 90, TITLE_Y: 14 };
const NARROW = { VB_W: 350, VB_H: 512, PX: 24, SX: 12, SW: 326, STRIP_Y: 372, STRIP_H: 84, CELL_MAX: 90, TITLE_Y: 342 };

const ANGLES = [28, 82, 142].map((d) => (d * Math.PI) / 180);
const NORMALS = ANGLES.map((a) => [-Math.sin(a), Math.cos(a)]);
const N_POINTS = 12;


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

// Seeded token vectors, kept clear of the hyperplanes and of each other.
function makePoints() {
  const rnd = mulberry32(7);
  const pts = [];
  let guard = 0;
  while (pts.length < N_POINTS && guard++ < 5000) {
    const x = (rnd() * 2 - 1) * (HALF - 14);
    const y = (rnd() * 2 - 1) * (HALF - 14);
    if (Math.hypot(x, y) < 22) continue;
    if (NORMALS.some(([nx, ny]) => Math.abs(nx * x + ny * y) < 14)) continue;
    if (pts.some((p) => Math.hypot(p.x - x, p.y - y) < 30)) continue;
    pts.push({ x, y });
  }
  return pts;
}

// Sutherland-Hodgman clip of a convex polygon against one half-plane.
function clip(poly, [nx, ny], positive) {
  const s = positive ? 1 : -1;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = s * (nx * a[0] + ny * a[1]);
    const db = s * (nx * b[0] + ny * b[1]);
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

function area(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a) / 2;
}

function centroid(poly) {
  let x = 0;
  let y = 0;
  poly.forEach((p) => {
    x += p[0];
    y += p[1];
  });
  return [x / poly.length, y / poly.length];
}

const bitsOf = (code, k) => code.toString(2).padStart(k, '0');

export function mount(node) {
  node.classList.add('mu-sh');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Number of hyperplanes, k_sim">',
    [1, 2, 3].map((k) => `<button type="button" class="qi-chip" data-k="${k}" aria-pressed="false">k_sim = ${k}<small>${2 ** k} clusters</small></button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg" viewBox="0 0 ${WIDE.VB_W} ${WIDE.VB_H}" role="img" aria-label="A plane cut into regions by random hyperplanes, with 12 token vectors, and the row of 2^k_sim cluster cells that the tokens fall into.">`,
    '    <g class="mu-sh__titles"></g>',
    '    <g class="mu-sh__regions"></g>',
    '    <g class="mu-sh__planes"></g>',
    '    <g class="mu-sh__points"></g>',
    '    <g class="mu-sh__strip"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 mu-sh__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const titlesG = node.querySelector('.mu-sh__titles');
  const regionsG = node.querySelector('.mu-sh__regions');
  const planesG = node.querySelector('.mu-sh__planes');
  const pointsG = node.querySelector('.mu-sh__points');
  const stripG = node.querySelector('.mu-sh__strip');
  const statusEl = node.querySelector('.mu-sh__status');
  const chips = [...node.querySelectorAll('[data-k]')];
  const svg = node.querySelector('svg');

  const pts = makePoints();
  let k = 3;
  let hovered = null;
  let pinned = null;
  let polys = [];

  // Compact layout when the figure is narrower than the desktop composition,
  // so labels stay readable instead of scaling down with the SVG.
  const NARROW_BELOW = 700;
  const isNarrow = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < NARROW_BELOW;
  };
  let narrow = isNarrow();
  node.classList.toggle('mu-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (isNarrow() !== narrow) {
        narrow = isNarrow();
        node.classList.toggle('mu-narrow', narrow);
        relayout();
      }
    }).observe(node);
  }
  let G = narrow ? NARROW : WIDE;

  const square = [
    [-HALF, -HALF],
    [HALF, -HALF],
    [HALF, HALF],
    [-HALF, HALF],
  ];

  const codeOfPoint = (p) => {
    let c = 0;
    for (let i = 0; i < k; i++) c = (c << 1) | (NORMALS[i][0] * p.x + NORMALS[i][1] * p.y > 0 ? 1 : 0);
    return c;
  };
  const tokensIn = (c) => pts.map((p, i) => (codeOfPoint(p) === c ? i : -1)).filter((i) => i >= 0);
  const tint = (c) => 0.1 + (0.5 * (c + 1)) / 2 ** k;

  function build() {
    G = narrow ? NARROW : WIDE;
    const { VB_W, VB_H, PX, SX, SW, STRIP_Y, STRIP_H, CELL_MAX, TITLE_Y } = G;
    const CX = PX + HALF;
    const CY = PY + HALF;
    svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
    clipRect.setAttribute('x', PX);
    const n = 2 ** k;
    titlesG.replaceChildren(
      el('text', { class: 'qi-label', x: PX, y: 14 }, narrow ? 'Token vector space (2D)' : 'Token vector space (2D illustration)'),
      el('text', { class: 'qi-label', x: SX, y: TITLE_Y }, 'Cluster IDs: one bit per hyperplane'),
    );
    regionsG.replaceChildren();
    planesG.replaceChildren();
    pointsG.replaceChildren();
    stripG.replaceChildren();

    polys = [];
    for (let c = 0; c < n; c++) {
      let poly = square;
      for (let i = 0; i < k && poly.length; i++) poly = clip(poly, NORMALS[i], ((c >> (k - 1 - i)) & 1) === 1);
      polys.push(poly.length >= 3 && area(poly) > 60 ? poly : null);
    }
    frameRect(regionsG);
    polys.forEach((poly, c) => {
      if (!poly) return;
      const path = poly.map((p, i) => `${i ? 'L' : 'M'}${(CX + p[0]).toFixed(1)} ${(CY + p[1]).toFixed(1)}`).join('') + 'Z';
      regionsG.appendChild(el('path', { class: 'mu-sh__region', d: path, style: `fill-opacity:${tint(c)}`, 'data-code': c }));
      const [lx, ly] = centroid(poly);
      regionsG.appendChild(el('text', { class: 'qi-label qi-label--strong mu-sh__region-label', x: CX + lx, y: CY + ly + 4, 'text-anchor': 'middle' }, bitsOf(c, k)));
    });

    for (let i = 0; i < k; i++) {
      const [nx, ny] = NORMALS[i];
      const dx = -ny;
      const dy = nx;
      const L = HALF * 1.45;
      const x1 = CX - dx * L;
      const y1 = CY - dy * L;
      const x2 = CX + dx * L;
      const y2 = CY + dy * L;
      planesG.appendChild(el('line', { class: 'mu-sh__plane', x1, y1, x2, y2, 'clip-path': 'url(#mu-sh-clip)' }));
    }
    // Hyperplane names sit just outside the frame at the end of each line.
    for (let i = 0; i < k; i++) {
      const [nx, ny] = NORMALS[i];
      const dx = -ny;
      const dy = nx;
      const t = HALF / Math.max(Math.abs(dx), Math.abs(dy));
      planesG.appendChild(el('text', { class: 'qi-label mu-sh__plane-label', x: CX + dx * t + (dx > 0 ? 6 : -6), y: CY + dy * t + 4, 'text-anchor': dx > 0 ? 'start' : 'end' }, `h${i + 1}`));
    }

    pts.forEach((p, i) => {
      pointsG.appendChild(el('circle', { class: 'mu-sh__pt', cx: CX + p.x, cy: CY + p.y, r: 6, 'data-token': i }));
    });

    const cw = Math.min(CELL_MAX, SW / n);
    for (let c = 0; c < n; c++) {
      const x = SX + c * cw;
      stripG.appendChild(el('rect', { class: 'mu-sh__cell', x: x + 1, y: STRIP_Y, width: cw - 2, height: STRIP_H, rx: 4, style: `fill-opacity:${tint(c)}`, 'data-code': c }));
      stripG.appendChild(el('text', { class: 'qi-label qi-label--strong', x: x + cw / 2, y: STRIP_Y - 8, 'text-anchor': 'middle' }, bitsOf(c, k)));
      const here = tokensIn(c);
      const cols = Math.max(1, Math.floor((cw - 10) / 16));
      here.forEach((t, j) => {
        stripG.appendChild(el('circle', { class: 'mu-sh__pt', cx: x + 12 + (j % cols) * 16, cy: STRIP_Y + 16 + Math.floor(j / cols) * 16, r: 6, 'data-token': t }));
      });
      stripG.appendChild(el('text', { class: 'qi-label', x: x + cw / 2, y: STRIP_Y + STRIP_H + 18, 'text-anchor': 'middle' }, here.length ? `${here.length}` : polys[c] ? '0' : 'none'));
    }
    stripG.appendChild(el('text', { class: 'qi-label', x: SX, y: STRIP_Y + STRIP_H + 42 }, 'Token vectors per cluster'));
  }

  function frameRect(g) {
    g.appendChild(el('rect', { class: 'qi-frame', x: G.PX, y: PY, width: PS, height: PS, rx: 4 }));
  }

  function defaultStatus() {
    const n = 2 ** k;
    return `<b>k_sim = ${k}</b>: ${k} random hyperplane${k > 1 ? 's give' : ' gives'} each token vector ${k} bit${k > 1 ? 's' : ''}, one per side it falls on, so it lands in one of <b>${n}</b> clusters. Hover a token to see its bits.`;
  }

  function highlight() {
    const hot = pinned || hovered;
    node.querySelectorAll('.is-hot').forEach((n) => n.classList.remove('is-hot'));
    if (!hot) {
      statusEl.innerHTML = defaultStatus();
      return;
    }
    if (hot.type === 'token') {
      const p = pts[hot.i];
      const c = codeOfPoint(p);
      node.querySelectorAll(`[data-token="${hot.i}"]`).forEach((n) => n.classList.add('is-hot'));
      node.querySelectorAll(`[data-code="${c}"]`).forEach((n) => n.classList.add('is-hot'));
      const parts = [];
      for (let i = 0; i < k; i++) parts.push(`h<sub>${i + 1}</sub> → ${NORMALS[i][0] * p.x + NORMALS[i][1] * p.y > 0 ? 1 : 0}`);
      statusEl.innerHTML = `Token ${hot.i + 1}: ${parts.join(', ')} → bits <b>${bitsOf(c, k)}</b> → cluster <b>${c}</b>.`;
      return;
    }
    const c = hot.code;
    node.querySelectorAll(`[data-code="${c}"]`).forEach((n) => n.classList.add('is-hot'));
    const here = tokensIn(c);
    here.forEach((i) => node.querySelectorAll(`[data-token="${i}"]`).forEach((n) => n.classList.add('is-hot')));
    statusEl.innerHTML = polys[c]
      ? `Cluster <b>${bitsOf(c, k)}</b> holds <b>${here.length}</b> of the ${N_POINTS} token vectors.`
      : `Cluster <b>${bitsOf(c, k)}</b> cannot occur in this 2D picture: lines through the origin cut a plane into only ${2 * k} wedges, so some codes stay empty. In hundreds of dimensions, all ${2 ** k} codes occur.`;
  }

  function setK(next) {
    k = next;
    pinned = null;
    hovered = null;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.k) === k)));
    build();
    highlight();
  }

  function hotFromEvent(e) {
    const t = e.target.closest ? e.target.closest('[data-token], [data-code]') : null;
    if (!t) return null;
    if (t.hasAttribute('data-token')) return { type: 'token', i: Number(t.getAttribute('data-token')) };
    return { type: 'cluster', code: Number(t.getAttribute('data-code')) };
  }
  const same = (a, b) => !!a && !!b && a.type === b.type && a.i === b.i && a.code === b.code;
  svg.addEventListener('pointerover', (e) => {
    const h = hotFromEvent(e);
    if (h && !same(h, hovered)) {
      hovered = h;
      highlight();
    }
  });
  svg.addEventListener('pointerout', (e) => {
    if (hotFromEvent(e)) {
      hovered = null;
      highlight();
    }
  });
  svg.addEventListener('click', (e) => {
    const h = hotFromEvent(e);
    if (!h) return;
    pinned = same(h, pinned) ? null : h;
    highlight();
  });
  chips.forEach((b) => b.addEventListener('click', () => setK(Number(b.dataset.k))));

  // Clip the hyperplane lines to the plane frame.
  const defs = el('defs', {});
  const cp = el('clipPath', { id: 'mu-sh-clip' });
  const clipRect = el('rect', { x: WIDE.PX, y: PY, width: PS, height: PS });
  cp.appendChild(clipRect);
  defs.appendChild(cp);
  svg.insertBefore(defs, svg.firstChild);

  function relayout() {
    build();
    highlight();
  }

  setK(3);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
