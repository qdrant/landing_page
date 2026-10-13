/*
 * layout island: interactive replacement for hardware-optimized.png.
 *
 * Twelve cells read in order, laid out two ways: scattered in memory and
 * linked by pointers, or contiguous in an array. In the linked layout each
 * address is only known after the previous cell has been read; in the array the
 * next cell sits right after the current one, so the hardware can stream it in
 * ahead of time. Hover or click a cell to compare.
 *
 * The positions are illustrative and seeded.
 */

const NS = 'http://www.w3.org/2000/svg';
const N = 12;
const CELL = 32;

const WIDE = { VB_W: 760, VB_H: 292, lx: 20, ly: 34, lw: 350, lh: 220, cx: 390, cy: 34, cw: 350, ch: 220, cols: 6, cpitch: 52, c0y: 84, crow: 62 };
const NARROW = { VB_W: 340, VB_H: 472, lx: 10, ly: 26, lw: 320, lh: 210, cx: 10, cy: 262, cw: 320, ch: 176, cols: 6, cpitch: 50, c0y: 294, crow: 52 };

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

function scatter(w, h) {
  const rnd = mulberry32(21);
  const pts = [];
  let guard = 0;
  while (pts.length < N && guard++ < 20000) {
    const x = 20 + rnd() * (w - 40 - CELL);
    const y = 20 + rnd() * (h - 40 - CELL);
    if (pts.some((p) => Math.hypot(p.x - x, p.y - y) < 64)) continue;
    pts.push({ x, y });
  }
  return pts;
}

export function mount(node) {
  node.classList.add('im-lay');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <svg class="qi-svg" viewBox="0 0 760 292" role="img" aria-label="Twelve cells read in order, scattered and linked by pointers on one side and contiguous in an array on the other.">',
    '    <g class="im-lay__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 im-lay__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.im-lay__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.im-lay__status');
  let hovered = null;
  let pinned = null;
  let narrow = false;

  const NARROW_BELOW = 700;
  const isNarrow = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < NARROW_BELOW;
  };
  narrow = isNarrow();
  node.classList.toggle('im-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (isNarrow() !== narrow) {
        narrow = isNarrow();
        node.classList.toggle('im-narrow', narrow);
        render();
      }
    }).observe(node);
  }

  function arrow(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const sx = x1 + ux * (CELL / 2 + 2);
    const sy = y1 + uy * (CELL / 2 + 2);
    const ex = x2 - ux * (CELL / 2 + 8);
    const ey = y2 - uy * (CELL / 2 + 8);
    g.appendChild(el('line', { class: 'im-lay__arrow', x1: sx, y1: sy, x2: ex, y2: ey }));
    const hx = x2 - ux * (CELL / 2 + 2);
    const hy = y2 - uy * (CELL / 2 + 2);
    g.appendChild(el('polygon', { class: 'im-lay__head', points: `${hx},${hy} ${hx - ux * 8 - uy * 4},${hy - uy * 8 + ux * 4} ${hx - ux * 8 + uy * 4},${hy - uy * 8 - ux * 4}` }));
  }

  function render() {
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();

    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: G.lx, y: G.ly - 10 }, 'Scattered, linked by pointers'));
    g.appendChild(el('rect', { class: 'qi-frame', x: G.lx, y: G.ly, width: G.lw, height: G.lh, rx: 6 }));
    const pts = scatter(G.lw, G.lh).map((p) => ({ x: G.lx + p.x + CELL / 2, y: G.ly + p.y + CELL / 2 }));
    for (let i = 0; i < pts.length - 1; i++) arrow(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    pts.forEach((p, i) => {
      g.appendChild(el('rect', { class: 'im-lay__cell im-lay__cell--a', x: p.x - CELL / 2, y: p.y - CELL / 2, width: CELL, height: CELL, rx: 4, 'data-kind': 'a', 'data-i': i }));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong im-lay__num', x: p.x, y: p.y + 5, 'text-anchor': 'middle', 'pointer-events': 'none' }, `${i + 1}`));
    });

    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: G.cx, y: G.cy - 10 }, 'Contiguous array'));
    g.appendChild(el('rect', { class: 'qi-frame', x: G.cx, y: G.cy, width: G.cw, height: G.ch, rx: 6 }));
    const x0 = G.cx + (G.cw - (G.cols * G.cpitch - (G.cpitch - CELL))) / 2;
    for (let i = 0; i < N; i++) {
      const x = x0 + (i % G.cols) * G.cpitch;
      const y = G.c0y + Math.floor(i / G.cols) * G.crow;
      g.appendChild(el('rect', { class: 'im-lay__cell im-lay__cell--b', x, y, width: CELL, height: CELL, rx: 4, 'data-kind': 'b', 'data-i': i }));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong im-lay__num', x: x + CELL / 2, y: y + CELL / 2 + 5, 'text-anchor': 'middle', 'pointer-events': 'none' }, `${i + 1}`));
    }
    g.appendChild(el('text', { class: 'qi-label', x: G.cx + G.cw / 2, y: G.cy + G.ch - 12, 'text-anchor': 'middle' }, 'one sequential pass'));
    highlight();
  }

  function defaultStatus() {
    return 'Read the twelve cells in order. When they are <b>scattered</b>, each address is known only after the previous cell has been read. When they are <b>contiguous</b>, the next cell sits right after the current one. Hover a cell to compare.';
  }

  function highlight() {
    const hot = pinned || hovered;
    node.querySelectorAll('.is-hot').forEach((n) => n.classList.remove('is-hot'));
    if (!hot) {
      statusEl.innerHTML = defaultStatus();
      return;
    }
    node.querySelectorAll(`[data-i="${hot.i}"]`).forEach((n) => n.classList.add('is-hot'));
    const n = hot.i + 1;
    if (n === 1) {
      statusEl.innerHTML = 'Cell <b>1</b> is where the read starts, in either layout.';
    } else if (hot.kind === 'a') {
      statusEl.innerHTML = `Cell <b>${n}</b> is found only by reading cell ${n - 1} first. The hardware cannot prefetch it, because its address is not known in advance.`;
    } else {
      statusEl.innerHTML = `Cell <b>${n}</b> sits right after cell ${n - 1}, so the hardware can stream it in before it is needed.`;
    }
  }

  const hotFrom = (e) => {
    const t = e.target.closest ? e.target.closest('[data-i]') : null;
    return t ? { kind: t.getAttribute('data-kind'), i: Number(t.getAttribute('data-i')) } : null;
  };
  const same = (a, b) => !!a && !!b && a.kind === b.kind && a.i === b.i;
  svg.addEventListener('pointerover', (e) => {
    const h = hotFrom(e);
    if (h && !same(h, hovered)) {
      hovered = h;
      highlight();
    }
  });
  svg.addEventListener('pointerout', (e) => {
    if (hotFrom(e)) {
      hovered = null;
      highlight();
    }
  });
  svg.addEventListener('click', (e) => {
    const h = hotFrom(e);
    if (!h) return;
    pinned = same(h, pinned) ? null : h;
    highlight();
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
