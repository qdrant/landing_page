/*
 * crossmodal island: interactive replacement for clip-discovery.png.
 *
 * Cross-modal search with discovery. The target is a text ("Chair") on the
 * texts plane; the results are images on the images plane. With only the target,
 * the nearest images can include ones on the wrong side of what we want. A
 * context pair of two images (a positive and a negative) defines a hyperplane in
 * the images plane, and discovery keeps only the images on the positive side,
 * ranked by closeness to the target.
 * Points are hand-placed and illustrative; the neighbors are computed.
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
  node.classList.toggle('ds-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('ds-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

let uid = 0;

// Label placement: try several spots around a point and take the first that stays inside the
// bounds and clears every obstacle (points as circles, lines as segments) and earlier labels.
function makePlacer(bounds, obstacles) {
  const placed = [];
  const H = 14;
  const segHits = (o, r) => {
    const len = Math.hypot(o.x2 - o.x1, o.y2 - o.y1);
    const n = Math.max(2, Math.ceil(len / 5));
    for (let i = 0; i <= n; i++) {
      const x = o.x1 + ((o.x2 - o.x1) * i) / n;
      const y = o.y1 + ((o.y2 - o.y1) * i) / n;
      if (x > r.x - 2 && x < r.x + r.w + 2 && y > r.y - 2 && y < r.y + r.h + 2) return true;
    }
    return false;
  };
  const hits = (r) =>
    obstacles.some((o) => (o.s ? segHits(o, r) : o.x > r.x - o.r && o.x < r.x + r.w + o.r && o.y > r.y - o.r && o.y < r.y + r.h + o.r)) ||
    placed.some((o) => r.x < o.x + o.w + 3 && r.x + r.w + 3 > o.x && r.y < o.y + o.h + 2 && r.y + r.h + 2 > o.y);
  return function place(p, text, rad = 14) {
    const w = text.length * 7.9;
    const rings = [0, 14, 30];
    let best = null;
    for (const extra of rings) {
      const r = rad + extra;
      const cands = [
        [p[0] + r + 2, p[1] - H / 2],
        [p[0] - r - 2 - w, p[1] - H / 2],
        [p[0] + 6, p[1] - r - H],
        [p[0] + 6, p[1] + r],
        [p[0] - 6 - w, p[1] - r - H],
        [p[0] - 6 - w, p[1] + r],
        [p[0] - w / 2, p[1] - r - H],
        [p[0] - w / 2, p[1] + r],
      ];
      for (const [x, y] of cands) {
        const box = { x, y, w, h: H };
        if (x < bounds.x0 || x + w > bounds.x1 || y < bounds.y0 || y + H > bounds.y1) continue;
        if (!hits(box)) {
          best = { box, extra };
          break;
        }
      }
      if (best) break;
    }
    if (!best) {
      const x = Math.min(Math.max(p[0] + rad + 2, bounds.x0), bounds.x1 - w);
      best = { box: { x, y: Math.min(Math.max(p[1] - H / 2, bounds.y0), bounds.y1 - H), w, h: H }, extra: 0 };
    }
    placed.push(best.box);
    return { x: best.box.x, y: best.box.y + H - 3, leader: best.extra > 0, box: best.box };
  };
}
// Unit coordinates inside each plane.
const POS = [-0.55, -0.3];
const NEG = [0.8, 0.25];
const OTHERS = [[-0.15, -0.05], [-0.25, 0.4], [0.3, -0.25], [0.45, 0.3], [-0.8, 0.2], [-0.35, -0.65], [0.1, 0.55], [0.62, -0.5], [-0.05, -0.6], [0.95, -0.2], [-0.7, 0.65], [0.2, 0.1]];
const TARGET = [0.28, 0.0];
const TEXTS = [[-0.7, 0.3], [-0.3, -0.5], [0.5, 0.5], [0.8, -0.3], [-0.1, 0.45], [0.95, 0.1], [-0.85, -0.2], [0.05, -0.2]];
const N_RESULTS = 4;
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const STATES = [
  { id: 'target', label: 'Text target only' },
  { id: 'context', label: 'Add a context pair' },
];

const WIDE = { VB_W: 760, cx: 380, rx: 340, iCy: 106, tCy: 316, ry: 70, H: 430 };
const NARROW = { VB_W: 340, cx: 170, rx: 150, iCy: 88, tCy: 262, ry: 56, H: 350 };

export function mount(node) {
  const clipId = `ds-cm-clip-${uid++}`;
  node.classList.add('ds-cm');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="View">',
    STATES.map((s) => `<button type="button" class="qi-chip" data-state="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 430" role="img" aria-label="A text target on the texts plane, images on the images plane, and a context pair that confines the search to one side of a hyperplane.">',
    `    <defs><clipPath id="${clipId}"><ellipse class="ds-cm__clip" cx="0" cy="0" rx="1" ry="1"/></clipPath></defs>`,
    '    <g class="ds-cm__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ds-cm__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ds-cm__g');
  const svg = node.querySelector('svg');
  const clip = node.querySelector('.ds-cm__clip');
  const statusEl = node.querySelector('.ds-cm__status');
  const chips = [...node.querySelectorAll('[data-state]')];
  let state = 'context';
  const isNarrow = watchNarrow(node, () => render());

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.H}`);
    const at = (cy, p) => [G.cx + p[0] * G.rx * 0.94, cy + p[1] * G.ry * 0.84];
    const I = (p) => at(G.iCy, p);
    const T = (p) => at(G.tCy, p);
    clip.setAttribute('cx', G.cx);
    clip.setAttribute('cy', G.iCy);
    clip.setAttribute('rx', G.rx);
    clip.setAttribute('ry', G.ry);
    g.replaceChildren();

    // Planes.
    [[G.iCy, 'Images plane'], [G.tCy, 'Texts plane']].forEach(([cy, label]) => {
      g.appendChild(el('ellipse', { class: 'ds-cm__plane', cx: G.cx, cy, rx: G.rx, ry: G.ry }));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: narrow ? G.cx - G.rx : G.cx + G.rx - 4, y: cy - G.ry - 8, 'text-anchor': narrow ? 'start' : 'end' }, label));
    });

    const images = [{ p: POS, role: 'pos' }, { p: NEG, role: 'neg' }, ...OTHERS.map((p) => ({ p, role: '' }))];
    const onPositive = (p) => d(p, POS) <= d(p, NEG);
    const eligible = images.filter((im) => !im.role);
    const pool = state === 'context' ? eligible.filter((im) => onPositive(im.p)) : eligible;
    const results = [...pool].sort((a, b) => d(a.p, TARGET) - d(b.p, TARGET)).slice(0, N_RESULTS);
    const isResult = (im) => results.includes(im);

    if (state === 'context') {
      // Zone (positive side) in the images plane: the unit square clipped by the bisector.
      const m = [(POS[0] + NEG[0]) / 2, (POS[1] + NEG[1]) / 2];
      const nv = [POS[0] - NEG[0], POS[1] - NEG[1]];
      let poly = [[-1.3, -1.3], [1.3, -1.3], [1.3, 1.3], [-1.3, 1.3]];
      const out = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k];
        const b = poly[(k + 1) % poly.length];
        const da = (a[0] - m[0]) * nv[0] + (a[1] - m[1]) * nv[1];
        const db = (b[0] - m[0]) * nv[0] + (b[1] - m[1]) * nv[1];
        if (da >= 0) out.push(a);
        if (da >= 0 !== db >= 0) {
          const t = da / (da - db);
          out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
        }
      }
      poly = out;
      g.appendChild(el('path', { class: 'ds-cm__zone', 'clip-path': `url(#${clipId})`, d: poly.map((p, k) => { const q = I(p); return `${k ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }).join('') + 'Z' }));
      const dir = [-nv[1], nv[0]];
      const L = Math.hypot(dir[0], dir[1]) || 1;
      const u = [(dir[0] / L) * 3, (dir[1] / L) * 3];
      const a = I([m[0] - u[0], m[1] - u[1]]);
      const b = I([m[0] + u[0], m[1] + u[1]]);
      g.appendChild(el('line', { class: 'ds-cm__hyper', x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'clip-path': `url(#${clipId})` }));
    }

    // Lines from the target up to the results.
    const tp = T(TARGET);
    const obstacles = [];
    results.forEach((im) => {
      const p = I(im.p);
      g.appendChild(el('line', { class: 'ds-cm__tline', x1: tp[0], y1: tp[1], x2: p[0], y2: p[1] }));
      obstacles.push({ s: true, x1: tp[0], y1: tp[1], x2: p[0], y2: p[1] });
    });
    images.forEach((im) => {
      const q = I(im.p);
      obstacles.push({ x: q[0], y: q[1], r: 13 });
    });
    TEXTS.forEach((p) => {
      const q = T(p);
      obstacles.push({ x: q[0], y: q[1], r: 9 });
    });
    obstacles.push({ x: tp[0], y: tp[1], r: 14 });
    const place = makePlacer({ x0: 2, y0: 2, x1: G.VB_W - 2, y1: G.H - 24 }, obstacles);
    const labels = [];
    if (state === 'context') {
      labels.push([I(POS), 'Positive', 'is-pos'], [I(NEG), 'Negative', 'is-neg']);
    }
    labels.push([tp, narrow ? 'Target: "Chair"' : 'Target: text "Chair"', 'is-target']);

    // Points: texts, then images (so the rings sit on top).
    TEXTS.forEach((p) => {
      const q = T(p);
      g.appendChild(el('rect', { class: 'ds-cm__pt is-txt', x: q[0] - 5, y: q[1] - 5, width: 10, height: 10, rx: 2 }));
    });
    images.forEach((im) => {
      const q = I(im.p);
      const fade = state === 'context' && !im.role && !onPositive(im.p);
      g.appendChild(el('circle', { class: `ds-cm__pt is-img${fade ? ' is-faded' : ''}`, cx: q[0], cy: q[1], r: 6 }));
      if (isResult(im)) g.appendChild(el('circle', { class: 'ds-cm__ring is-hit', cx: q[0], cy: q[1], r: 11 }));
    });
    // Context pair: rings on the actual points, strong only when the context is active.
    [[POS, 'is-pos', 'Positive'], [NEG, 'is-neg', 'Negative']].forEach(([p, cls, label]) => {
      const q = I(p);
      const on = state === 'context';
      g.appendChild(el('circle', { class: `ds-cm__ring ${cls}${on ? '' : ' is-off'}`, cx: q[0], cy: q[1], r: 11 }));
    });
    g.appendChild(el('circle', { class: 'ds-cm__ring is-target', cx: tp[0], cy: tp[1], r: 12 }));
    labels.forEach(([pt, text, cls]) => {
      const pl = place(pt, text);
      g.appendChild(el('text', { class: `qi-label ds-cm__lab ${cls}`, x: pl.x, y: pl.y }, text));
    });

    // Legend
    const ly = G.H - 8;
    const lx = G.cx - G.rx;
    g.appendChild(el('circle', { class: 'ds-cm__pt is-img', cx: lx + 8, cy: ly - 4, r: 6 }));
    g.appendChild(el('text', { class: 'qi-label', x: lx + 22, y: ly }, 'image'));
    g.appendChild(el('rect', { class: 'ds-cm__pt is-txt', x: lx + 80, y: ly - 9, width: 10, height: 10, rx: 2 }));
    g.appendChild(el('text', { class: 'qi-label', x: lx + 96, y: ly }, 'text'));
    g.appendChild(el('circle', { class: 'ds-cm__ring is-hit', cx: lx + 150, cy: ly - 4, r: 8 }));
    g.appendChild(el('text', { class: 'qi-label', x: lx + 164, y: ly }, 'top results'));
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.H + 12}`);

    const wrong = results.filter((im) => !onPositive(im.p)).length;
    statusEl.innerHTML = state === 'target'
      ? `With only the <b>text target</b>, the ${N_RESULTS} nearest images include <b>${wrong}</b> that sit on the negative side of the pair, closer to the unwanted example than to the wanted one.`
      : `The <b>context pair</b> (two images) draws a hyperplane in the images plane, so only the ${pool.length} images on the positive side are eligible. The <b>text target</b> then ranks them: all ${N_RESULTS} top results are on the positive side. Points are illustrative.`;
  }

  function setState(s) {
    state = s;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === state)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setState(b.dataset.state)));

  setState(state);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
