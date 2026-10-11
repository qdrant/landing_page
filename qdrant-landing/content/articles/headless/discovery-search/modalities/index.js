/*
 * modalities island: interactive replacement for clip-mental-model.png.
 *
 * The mental model of a multimodal encoder such as CLIP. Two views of the same
 * concepts (each has an image and a text):
 *   Expected:     one mixed space, where an image sits next to its own text.
 *   Modality gap: images and texts on separate planes, so an image's nearest
 *                 neighbors are other images and its own text is far away.
 * Points are seeded and illustrative; the nearest neighbors are computed.
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

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 14;
const rnd = mulberry32(17);
// Concept positions inside a unit disc; concept 0 is "chair".
const CONCEPT = [[0.35, 0.05]];
while (CONCEPT.length < N) {
  const r = Math.sqrt(rnd()) * 0.88;
  const th = rnd() * Math.PI * 2;
  const p = [r * Math.cos(th), r * Math.sin(th)];
  if (CONCEPT.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.27)) CONCEPT.push(p);
}
const JIT = Array.from({ length: N }, () => [(rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.12]);
const GAP_JIT = Array.from({ length: N }, () => [(rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.3]);

const STATES = [
  { id: 'expected', label: 'Expected: one mixed space' },
  { id: 'gap', label: 'Modality gap: two planes' },
];

const WIDE = { VB_W: 760, cx: 380, rx: 340, eCy: 190, eRy: 165, iCy: 96, tCy: 306, pRy: 66, H: 420 };
const NARROW = { VB_W: 340, cx: 170, rx: 150, eCy: 150, eRy: 125, iCy: 80, tCy: 250, pRy: 50, H: 340 };

export function mount(node) {
  node.classList.add('ds-md');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="View">',
    STATES.map((s) => `<button type="button" class="qi-chip" data-state="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 420" role="img" aria-label="Image and text embeddings, either mixed in one space or on two separate planes.">',
    '    <g class="ds-md__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ds-md__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ds-md__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ds-md__status');
  const chips = [...node.querySelectorAll('[data-state]')];
  let state = 'gap';
  const isNarrow = watchNarrow(node, () => render());

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    const two = state === 'gap';
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.H}`);
    g.replaceChildren();
    const at = (cy, ry, p) => [G.cx + p[0] * G.rx * 0.94, cy + p[1] * ry * 0.84];
    const imgP = CONCEPT.map((c) => at(two ? G.iCy : G.eCy, two ? G.pRy : G.eRy, c));
    const txtP = CONCEPT.map((c, i) => (two
      ? at(G.tCy, G.pRy, [c[0] + GAP_JIT[i][0], c[1] + GAP_JIT[i][1]])
      : [imgP[i][0] + JIT[i][0] * G.rx, imgP[i][1] + JIT[i][1] * G.eRy]));
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

    const plane = (cy, ry, label) => {
      g.appendChild(el('ellipse', { class: 'ds-md__plane', cx: G.cx, cy, rx: G.rx, ry }));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong ds-md__plabel', x: narrow ? G.cx - G.rx : G.cx + G.rx - 4, y: cy - ry - 8, 'text-anchor': narrow ? 'start' : 'end' }, label));
    };
    if (two) {
      plane(G.iCy, G.pRy, 'Images plane');
      plane(G.tCy, G.pRy, 'Texts plane');
      [0, 3, 7, 10].forEach((i) => g.appendChild(el('line', { class: 'ds-md__pair', x1: imgP[i][0], y1: imgP[i][1], x2: txtP[i][0], y2: txtP[i][1] })));
    } else {
      plane(G.eCy, G.eRy, 'One shared space');
    }

    const q = imgP[0];
    const cands = [...imgP.map((p, i) => ({ k: 'img', i, p })), ...txtP.map((p, i) => ({ k: 'txt', i, p }))].filter((c) => !(c.k === 'img' && c.i === 0));
    const neighbors = cands.sort((a, b) => d(q, a.p) - d(q, b.p)).slice(0, 3);
    const isHit = (k, i) => neighbors.some((n) => n.k === k && n.i === i);

    imgP.forEach((p, i) => {
      g.appendChild(el('circle', { class: 'ds-md__pt is-img', cx: p[0], cy: p[1], r: 6 }));
      if (isHit('img', i)) g.appendChild(el('circle', { class: 'ds-md__ring is-hit', cx: p[0], cy: p[1], r: 11 }));
    });
    txtP.forEach((p, i) => {
      g.appendChild(el('rect', { class: 'ds-md__pt is-txt', x: p[0] - 5, y: p[1] - 5, width: 10, height: 10, rx: 2 }));
      if (isHit('txt', i)) g.appendChild(el('circle', { class: 'ds-md__ring is-hit', cx: p[0], cy: p[1], r: 11 }));
    });
    g.appendChild(el('circle', { class: 'ds-md__ring is-query', cx: q[0], cy: q[1], r: 12 }));
    const obstacles = [...imgP, ...txtP].map((p) => ({ x: p[0], y: p[1], r: 11 }));
    if (two) [0, 3, 7, 10].forEach((i) => obstacles.push({ s: true, x1: imgP[i][0], y1: imgP[i][1], x2: txtP[i][0], y2: txtP[i][1] }));
    const place = makePlacer({ x0: 2, y0: 2, x1: G.VB_W - 2, y1: G.H - 24 }, obstacles);
    const labelsM = [[q, 'Image of a chair']];
    if (two) labelsM.push([txtP[0], 'Text "Chair"']);
    labelsM.forEach(([pt, text]) => {
      const pl = place(pt, text);
      g.appendChild(el('text', { class: 'qi-label ds-md__qlab', x: pl.x, y: pl.y }, text));
    });

    const ly = G.H - 8;
    g.appendChild(el('circle', { class: 'ds-md__pt is-img', cx: G.cx - G.rx + 8, cy: ly - 4, r: 6 }));
    g.appendChild(el('text', { class: 'qi-label', x: G.cx - G.rx + 22, y: ly }, 'image'));
    g.appendChild(el('rect', { class: 'ds-md__pt is-txt', x: G.cx - G.rx + 80, y: ly - 9, width: 10, height: 10, rx: 2 }));
    g.appendChild(el('text', { class: 'qi-label', x: G.cx - G.rx + 96, y: ly }, 'text'));
    g.appendChild(el('circle', { class: 'ds-md__ring is-hit', cx: G.cx - G.rx + 150, cy: ly - 4, r: 8 }));
    g.appendChild(el('text', { class: 'qi-label', x: G.cx - G.rx + 164, y: ly }, narrow ? 'nearest' : 'nearest neighbors'));
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.H + 12}`);

    const what = (c) => (c.k === 'img' ? 'another image' : c.i === 0 ? 'its own text "Chair"' : 'a text');
    statusEl.innerHTML = two
      ? `With a <b>modality gap</b>, images and texts sit on separate planes. The chair image's three nearest neighbors are ${neighbors.map(what).join(', ')}, and its own text "Chair" is far away on the other plane. Positions are illustrative.`
      : `If text and images shared <b>one mixed space</b>, the chair image's three nearest neighbors would be ${neighbors.map(what).join(', ')}. This is the intuitive picture, and it is not how a multimodal encoder behaves.`;
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
