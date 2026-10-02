/*
 * slicing mechanism island: interactive replacement for slicing-mechanism.png.
 *
 * An unsorted collection of points runs through `hash(id) % total`, which puts
 * every point into exactly one of `total` slices. The reader changes `total`
 * and hovers (or pins) a point or a slice to see that the assignment depends
 * only on the ID and the total: slices never overlap, and together they cover
 * the whole collection.
 *
 * The hash drawn here is an illustrative integer mixer. Qdrant's own hash is
 * internal; the island only shows the property the slice filter guarantees.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Two
 * layouts: a wide one (slices in a row) and a narrow one (slices in a 2 x 2
 * grid) so labels stay readable on phones.
 */

const NS = 'http://www.w3.org/2000/svg';

const N_POINTS = 32;
const TOTALS = [2, 3, 4];
const WIDE_MIN = 560; // container px at which the wide layout keeps text >= 12px
const R = 6.5; // dot radius
const PITCH = 22; // dot pitch inside a slice frame
const SLICE_PAD = 12;
const CAT = ['--qi-cat-1', '--qi-cat-3', '--qi-cat-2', '--qi-cat-4'];

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

// Illustrative 32-bit integer mixer (murmur3 finalizer). Not Qdrant's hash.
function hash32(x) {
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return x >>> 0;
}

const sliceOf = (id, total) => hash32(id) % total;

export function mount(node) {
  node.classList.add('qi-sl');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Total number of slices">',
    TOTALS.map((t) => `<button type="button" class="qi-chip qi-sl__total" data-total="${t}" aria-pressed="false">${t} slices</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-sl__svg" role="img" aria-label="Thirty-two points of a collection run through hash(id) modulo the number of slices. Each point lands in exactly one slice."></svg>',
    '  <p class="qi-status qi-sl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-sl__svg');
  const statusEl = node.querySelector('.qi-sl__status');
  const totalBtns = [...node.querySelectorAll('.qi-sl__total')];

  // Fixed point set: ids 1..N, placed on a jittered grid so the collection reads as unsorted.
  const rnd = mulberry32(7);
  const ids = Array.from({ length: N_POINTS }, (_, i) => i + 1);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const jitter = ids.map(() => [(rnd() - 0.5) * 12, (rnd() - 0.5) * 10]);

  let total = 4;
  let layout = '';
  let hovered = null; // { type: 'point', id } | { type: 'slice', k }
  let pinned = null;
  let dots = []; // { id, collection: <circle>, slice: <circle> }
  let frames = []; // <g> per slice

  const colorOf = (k) => `var(${CAT[k % CAT.length]})`;

  function members() {
    const out = Array.from({ length: total }, () => []);
    ids.slice().sort((a, b) => a - b).forEach((id) => out[sliceOf(id, total)].push(id));
    return out;
  }

  function build() {
    svg.replaceChildren();
    const wide = layout === 'wide';
    const VB_W = wide ? 640 : 360;
    const groups = members();
    const maxCount = Math.max(...groups.map((g) => g.length));

    const gap = wide ? 16 : 24;
    const sliceW = wide ? (VB_W - gap * (total - 1)) / total : (VB_W - gap) / 2;
    const cols = Math.max(1, Math.floor((sliceW - 2 * SLICE_PAD) / PITCH));
    const rows = Math.ceil(maxCount / cols);
    const sliceH = SLICE_PAD + rows * PITCH + 30;

    // Collection frame + dots
    const colW = wide ? 330 : VB_W;
    const colY = 24;
    const colH = 132;
    svg.appendChild(el('text', { class: 'qi-label', x: 0, y: 16 }, 'collection, unsorted'));
    svg.appendChild(el('rect', { class: 'qi-frame', x: 0.5, y: colY, width: colW - 1, height: colH, rx: 8 }));
    const gcols = 8;
    const gx = (colW - 40) / (gcols - 1);
    const gy = (colH - 40) / 3;

    // Hash box + collection connector
    const hashW = wide ? 220 : 190;
    const hashH = 44;
    const hashX = wide ? 420 : (VB_W - hashW) / 2;
    const hashY = wide ? 54 : colY + colH + 22;
    const hashCx = hashX + hashW / 2;
    if (wide) {
      svg.appendChild(el('line', { class: 'qi-sl__link', x1: colW, y1: hashY + hashH / 2, x2: hashX, y2: hashY + hashH / 2 }));
    } else {
      svg.appendChild(el('line', { class: 'qi-sl__link', x1: hashCx, y1: colY + colH, x2: hashCx, y2: hashY }));
    }
    svg.appendChild(el('rect', { class: 'qi-sl__hash', x: hashX, y: hashY, width: hashW, height: hashH, rx: 8 }));
    svg.appendChild(el('text', { class: 'qi-title qi-sl__hash-text', x: hashCx, y: hashY + hashH / 2 + 5, 'text-anchor': 'middle' }, `hash(id) % ${total}`));

    // Slice frames
    const sliceTop = wide ? 208 : hashY + hashH + 22;
    const rowGap = 14;
    const origins = groups.map((_, k) => {
      if (wide) return { x: k * (sliceW + gap), y: sliceTop };
      return { x: (k % 2) * (sliceW + gap), y: sliceTop + Math.floor(k / 2) * (sliceH + rowGap) };
    });

    // Connectors first so frames and dots draw over their ends.
    if (wide) {
      const y0 = hashY + hashH;
      groups.forEach((_, k) => {
        const cx = origins[k].x + sliceW / 2;
        svg.appendChild(
          el('path', { class: 'qi-sl__conn', style: `stroke:${colorOf(k)}`, d: `M${hashCx} ${y0} C${hashCx} ${y0 + 98}, ${cx} ${y0 + 52}, ${cx} ${sliceTop}`, fill: 'none' }),
        );
      });
    } else {
      const stubYs = groups.map((_, k) => origins[k].y + 18);
      svg.appendChild(el('line', { class: 'qi-sl__link', x1: hashCx, y1: hashY + hashH, x2: hashCx, y2: Math.max(...stubYs) }));
      groups.forEach((_, k) => {
        const left = k % 2 === 0;
        const x2 = left ? origins[k].x + sliceW : origins[k].x;
        svg.appendChild(el('line', { class: 'qi-sl__conn', style: `stroke:${colorOf(k)}`, x1: hashCx, y1: stubYs[k], x2, y2: stubYs[k] }));
      });
    }

    frames = groups.map((g, k) => {
      const { x, y } = origins[k];
      const fr = el('g', { class: 'qi-sl__slice', tabindex: 0, role: 'button', 'aria-pressed': 'false', 'aria-label': `Slice ${k} of ${total}, ${g.length} points`, 'data-slice': k });
      fr.appendChild(el('rect', { class: 'qi-sl__slice-rect', x: x + 0.5, y, width: sliceW - 1, height: sliceH, rx: 8, style: `stroke:${colorOf(k)}` }));
      fr.appendChild(el('text', { class: 'qi-label qi-label--strong', x: x + SLICE_PAD, y: y + sliceH - 10 }, `${k} / ${total} · ${g.length} pts`));
      svg.appendChild(fr);
      return fr;
    });

    // One dot per point in the collection and one in its slice, drawn on top.
    const byId = new Map();
    ids.forEach((id, i) => {
      const k = sliceOf(id, total);
      const cx = 20 + (i % gcols) * gx + jitter[i][0];
      const cy = colY + 20 + Math.floor(i / gcols) * gy + jitter[i][1];
      const c1 = el('circle', { class: 'qi-sl__dot', cx, cy, r: R, 'data-id': id, style: `fill:${colorOf(k)}` });
      svg.appendChild(c1);
      byId.set(id, { id, collection: c1 });
    });
    groups.forEach((g, k) => {
      g.forEach((id, n) => {
        const cx = origins[k].x + SLICE_PAD + R + (n % cols) * PITCH;
        const cy = origins[k].y + SLICE_PAD + R + Math.floor(n / cols) * PITCH;
        const c2 = el('circle', { class: 'qi-sl__dot', cx, cy, r: R, 'data-id': id, style: `fill:${colorOf(k)}` });
        svg.appendChild(c2);
        byId.get(id).slice = c2;
      });
    });
    dots = [...byId.values()];

    const lastBottom = origins.reduce((m, o) => Math.max(m, o.y + sliceH), 0);
    svg.setAttribute('viewBox', `0 0 ${VB_W} ${lastBottom + 2}`);
    svg.classList.toggle('is-narrow', !wide);
  }

  function defaultStatus() {
    return `<b>${N_POINTS} points, ${total} slices</b>: each ID lands in exactly one slice, so slices never overlap and together hold all ${N_POINTS} points. A worker that claims one slice sees only its points. Hover a point or select a slice.`;
  }

  function render() {
    const hot = pinned || hovered;
    dots.forEach((d) => {
      const k = sliceOf(d.id, total);
      const isId = hot && hot.type === 'point' && hot.id === d.id;
      const inSlice = hot && hot.type === 'slice' && hot.k === k;
      const dim = hot && !isId && !inSlice;
      [d.collection, d.slice].forEach((c) => {
        c.classList.toggle('is-hot', !!(isId || inSlice));
        c.classList.toggle('is-dim', !!dim);
      });
    });
    frames.forEach((f, k) => {
      const on = !!pinned && pinned.type === 'slice' && pinned.k === k;
      f.setAttribute('aria-pressed', String(on));
      f.classList.toggle('is-hot', !!(hot && hot.type === 'slice' && hot.k === k));
    });

    if (!hot) {
      statusEl.innerHTML = defaultStatus();
      return;
    }
    if (hot.type === 'point') {
      const k = sliceOf(hot.id, total);
      statusEl.innerHTML = `Point <b>id ${hot.id}</b> → <b>hash(${hot.id}) % ${total}</b> → slice <b>${k} / ${total}</b>. Its slice depends only on the ID and the total, never on the other points.`;
      return;
    }
    const g = members()[hot.k];
    statusEl.innerHTML = `Slice <b>${hot.k} / ${total}</b> holds <b>${g.length}</b> of the ${N_POINTS} points. Running the same filter again returns the same ${g.length}: IDs ${g.join(', ')}.`;
  }

  function relayout(force) {
    const w = svg.getBoundingClientRect().width || WIDE_MIN;
    const next = w >= WIDE_MIN ? 'wide' : 'narrow';
    if (!force && next === layout) return;
    layout = next;
    build();
    render();
  }

  function setTotal(t) {
    total = t;
    pinned = null;
    hovered = null;
    totalBtns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.total) === total)));
    build();
    render();
  }

  totalBtns.forEach((b) => b.addEventListener('click', () => setTotal(Number(b.dataset.total))));

  function hotFromEvent(e) {
    const t = e.target.closest ? e.target.closest('[data-id], [data-slice]') : null;
    if (!t) return null;
    if (t.hasAttribute('data-id')) return { type: 'point', id: Number(t.getAttribute('data-id')) };
    return { type: 'slice', k: Number(t.getAttribute('data-slice')) };
  }
  const same = (a, b) => !!a && !!b && a.type === b.type && a.id === b.id && a.k === b.k;

  svg.addEventListener('pointerover', (e) => {
    const h = hotFromEvent(e);
    if (h && !same(h, hovered)) {
      hovered = h;
      render();
    }
  });
  svg.addEventListener('pointerout', (e) => {
    if (hotFromEvent(e)) {
      hovered = null;
      render();
    }
  });
  svg.addEventListener('click', (e) => {
    const h = hotFromEvent(e);
    if (!h) return;
    pinned = same(h, pinned) ? null : h;
    render();
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const h = hotFromEvent(e);
    if (!h || h.type !== 'slice') return;
    e.preventDefault();
    pinned = same(h, pinned) ? null : h;
    render();
  });
  svg.addEventListener('focusin', (e) => {
    const h = hotFromEvent(e);
    if (h) {
      hovered = h;
      render();
    }
  });
  svg.addEventListener('focusout', () => {
    hovered = null;
    render();
  });

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => relayout(false)).observe(node);
  }

  totalBtns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.total) === total)));
  relayout(true);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
