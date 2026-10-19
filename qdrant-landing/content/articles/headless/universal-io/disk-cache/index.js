/*
 * DiskCache island for articles/universal-io.
 *
 * A remote file is mirrored into a local mmap file of the same size, split into
 * 16 KiB blocks, with a bitmap recording which blocks are already local. The
 * reader picks a read and watches the three steps from the article: check the
 * bitmap, then either return a slice of the mirror (hit), or fetch the whole
 * covering range (miss), or wait for an in-flight fetch that already covers it
 * (piggyback), then write to the mirror, mark the bitmap, and return a slice
 * borrowed from the mirror.
 *
 * State persists between reads, so blocks fetched by one read are hits for the
 * next, and once every block is local the fully_populated flag takes over. The
 * 16-block file and the read ranges are illustrative.
 *
 * Two compositions share one state: a wide one with each file on a single row
 * (viewBox 760 wide) and a compact one with two rows of eight blocks (viewBox
 * 360 wide), used when the island is narrower than COMPACT_BELOW px so labels
 * stay near their real size on a phone. Pure SVG + CSS on the shared island
 * design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';
const COMPACT_BELOW = 560;
const N = 16;
const INITIAL = [0, 1];

// Geometry per composition. `base` is the y of the first row of each zone.
const GEO = {
  wide: {
    W: 760, H: 350, bx0: 28, step: 44, cols: 16, bw: 40, bh: 36, rowGap: 0,
    base: { remote: 44, mirror: 208, bit: 332 },
    frames: [[6, 96, 'remote file · object storage'], [172, 112, 'local mmap mirror · 16 KiB blocks'], [296, 50, 'bitmap · which blocks are local']],
    labelY: { flight: 100, slice: 266 },
    arrow: { y1: 108, y2: 200, labelY: 148 },
    badge: { x: 744, y: 194, anchor: 'end' },
  },
  compact: {
    W: 360, H: 468, bx0: 12, step: 42, cols: 8, bw: 36, bh: 32, rowGap: 40,
    base: { remote: 42, mirror: 244, bit: 412 },
    frames: [[6, 130, 'remote file · object storage'], [208, 140, 'local mmap mirror · 16 KiB blocks'], [360, 100, 'bitmap · which blocks are local']],
    labelY: { flight: 132, slice: 336 },
    arrow: { y1: 140, y2: 204, labelY: 176 },
    badge: { x: 16, y: 452, anchor: 'start' },
    bitRowGap: 22,
  },
};

// `inflight` is a fetch another read in the batch has already started.
const READS = [
  { id: 'r0', label: 'blocks 0–1', from: 0, to: 1 },
  { id: 'r1', label: 'blocks 1–3', from: 1, to: 3 },
  { id: 'r2', label: 'blocks 4–5', from: 4, to: 5 },
  { id: 'r3', label: 'blocks 7–10', from: 7, to: 10, inflight: [6, 12], hint: 'with 6–12 in flight' },
  { id: 'r4', label: 'blocks 13–15', from: 13, to: 15 },
];

const rng = (a, b) => (a === b ? `block ${a}` : `blocks ${a}–${b}`);

const STATUS_IDLE =
  'The remote file is mirrored into a local mmap file, split into 16 KiB blocks, and a bitmap records which blocks are local. Pick a read to see what <code>DiskCache</code> does.';

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-dc');
  const arrowId = `qi-dc-arrow-${Math.random().toString(36).slice(2, 8)}`;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <span class="qi-hint">Read:</span>',
    READS.map(
      (r) =>
        `<button type="button" class="qi-chip" data-read="${r.id}" aria-pressed="false">${r.label}${r.hint ? `<small>${r.hint}</small>` : ''}</button>`,
    ).join(''),
    '    </div>',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-reset>Reset</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-dc__svg" viewBox="0 0 760 350" role="img"',
    '    aria-label="DiskCache mirrors a remote file into a local mmap file of 16 blocks and keeps a bitmap of the blocks that are local. A read of local blocks returns a slice of the mirror. A read of a missing block fetches the covering range from object storage, writes it to the mirror, marks the bitmap, and returns a slice of the mirror.">',
    '    <defs>',
    `      <marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">`,
    '        <path class="qi-dc__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    '    <g class="qi-dc__layer"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--3 qi-dc__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-dc__svg');
  const layer = node.querySelector('.qi-dc__layer');
  const statusEl = node.querySelector('.qi-dc__status');
  const readBtns = [...node.querySelectorAll('[data-read]')];
  const resetBtn = node.querySelector('[data-reset]');

  // ── State shared by both compositions ──
  let local = new Set(INITIAL);
  let selected = null;
  let timers = [];
  let view = { req: null, slice: null, own: null, flight: null, arrow: null, text: STATUS_IDLE };
  let g = GEO.wide;
  let compact = null;
  let mirror = [];
  let bits = [];
  let ov = {};
  let arrow = null;
  let arrowLabel = null;
  let badge = null;

  // Position of block i in a zone (remote, mirror).
  const blockX = (i) => g.bx0 + (i % g.cols) * g.step;
  const blockY = (zone, i) => g.base[zone] + Math.floor(i / g.cols) * g.rowGap;

  // The highlight rectangles for blocks a..b: one per row they touch.
  function segments(a, b, zone) {
    const out = [];
    for (let row = 0; row * g.cols < N; row++) {
      const lo = Math.max(a, row * g.cols);
      const hi = Math.min(b, row * g.cols + g.cols - 1);
      if (lo <= hi) out.push({ x1: blockX(lo) - 3, x2: blockX(hi) + g.bw + 3, y: blockY(zone, lo) - 4 });
    }
    return out;
  }

  function build(isCompact) {
    g = isCompact ? GEO.compact : GEO.wide;
    layer.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${g.W} ${g.H}`);

    g.frames.forEach(([y, h, label]) => {
      layer.appendChild(el('rect', { class: 'qi-frame', x: 2, y, width: g.W - 4, height: h, rx: 6 }));
      layer.appendChild(el('text', { class: 'qi-frame-label', x: 16, y: y + 22 }, label));
    });

    mirror = [];
    bits = [];
    for (let i = 0; i < N; i++) {
      const r = el('g', { class: 'qi-dc__block qi-dc__block--remote' });
      r.appendChild(el('rect', { x: blockX(i), y: blockY('remote', i), width: g.bw, height: g.bh, rx: 4 }));
      r.appendChild(el('text', { x: blockX(i) + g.bw / 2, y: blockY('remote', i) + g.bh / 2 + 5, 'text-anchor': 'middle' }, String(i)));
      layer.appendChild(r);

      const m = el('g', { class: 'qi-dc__block qi-dc__block--mirror' });
      m.appendChild(el('rect', { x: blockX(i), y: blockY('mirror', i), width: g.bw, height: g.bh, rx: 4 }));
      m.appendChild(el('text', { x: blockX(i) + g.bw / 2, y: blockY('mirror', i) + g.bh / 2 + 5, 'text-anchor': 'middle' }, String(i)));
      layer.appendChild(m);
      mirror.push(m);

      const by = g.base.bit + Math.floor(i / g.cols) * (g.bitRowGap || 0) + 4;
      const b = el('text', { class: 'qi-dc__bit', x: blockX(i) + g.bw / 2, y: by, 'text-anchor': 'middle' }, '0');
      layer.appendChild(b);
      bits.push(b);
    }

    // Overlays, repositioned per phase: requested range and returned slice on
    // the mirror, own and in-flight fetches on the remote file.
    const overlay = (cls) => {
      const grp = el('g', { class: `qi-dc__ov ${cls}` });
      const rects = [0, 1].map(() => grp.appendChild(el('rect', { x: 0, y: 0, width: 0, height: g.bh + 8, rx: 6 })));
      const label = grp.appendChild(el('text', { x: 0, y: 0, 'text-anchor': 'middle' }));
      layer.appendChild(grp);
      return { grp, rects, label };
    };
    ov = {
      req: overlay('qi-dc__ov--req'),
      slice: overlay('qi-dc__ov--slice'),
      own: overlay('qi-dc__ov--own'),
      flight: overlay('qi-dc__ov--flight'),
    };

    arrow = el('path', { class: 'qi-dc__arrow', d: '', 'marker-end': `url(#${arrowId})` });
    arrowLabel = el('text', { class: 'qi-dc__arrow-label', x: 0, y: 0 });
    layer.appendChild(arrow);
    layer.appendChild(arrowLabel);

    badge = el('text', { class: 'qi-dc__badge', x: g.badge.x, y: g.badge.y, 'text-anchor': g.badge.anchor }, 'fully_populated: reads skip the bitmap');
    layer.appendChild(badge);
  }

  function place(o, range, zone, label, labelY) {
    if (!range) return o.grp.classList.remove('is-shown');
    const segs = segments(range[0], range[1], zone);
    o.rects.forEach((rect, i) => {
      const s = segs[i];
      if (!s) return rect.setAttribute('display', 'none');
      rect.removeAttribute('display');
      rect.setAttribute('x', s.x1);
      rect.setAttribute('y', s.y);
      rect.setAttribute('width', s.x2 - s.x1);
    });
    const last = segs[segs.length - 1];
    o.label.setAttribute('x', (last.x1 + last.x2) / 2);
    o.label.setAttribute('y', labelY);
    o.label.textContent = label;
    o.grp.classList.add('is-shown');
  }

  function render() {
    for (let i = 0; i < N; i++) {
      mirror[i].classList.toggle('is-local', local.has(i));
      bits[i].textContent = local.has(i) ? '1' : '0';
      bits[i].classList.toggle('is-set', local.has(i));
    }
    badge.classList.toggle('is-shown', local.size === N);

    place(ov.req, view.req, 'mirror', '', 0);
    place(ov.slice, view.slice, 'mirror', 'slice returned', g.labelY.slice);
    place(ov.own, view.own, 'remote', '', 0);
    place(ov.flight, view.flight, 'remote', 'in flight', g.labelY.flight);

    if (view.arrow) {
      const [a, b, label] = view.arrow;
      const segs = segments(a, b, 'remote');
      const last = segs[segs.length - 1];
      const mid = (last.x1 + last.x2) / 2;
      arrow.setAttribute('d', `M ${mid} ${g.arrow.y1} V ${g.arrow.y2}`);
      arrow.classList.add('is-shown');
      // Keep the label inside the drawing when the arrow is near the right edge.
      const flip = mid > g.W * 0.55;
      arrowLabel.setAttribute('x', flip ? mid - 10 : mid + 10);
      arrowLabel.setAttribute('text-anchor', flip ? 'end' : 'start');
      arrowLabel.setAttribute('y', g.arrow.labelY);
      arrowLabel.textContent = label;
      arrowLabel.classList.add('is-shown');
    } else {
      arrow.classList.remove('is-shown');
      arrowLabel.classList.remove('is-shown');
    }
    readBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.read === selected)));
    statusEl.innerHTML = view.text;
  }

  // Rebuild the drawing when the island crosses the compact threshold.
  function layout() {
    const width = node.getBoundingClientRect().width;
    if (width === 0) return;
    const isCompact = width < COMPACT_BELOW;
    if (isCompact === compact) return;
    compact = isCompact;
    node.classList.toggle('is-compact', isCompact);
    build(isCompact);
    render();
  }

  const clearTimers = () => {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
  };

  function run(read) {
    clearTimers();
    selected = read.id;
    const { from: a, to: b } = read;
    const need = [];
    for (let i = a; i <= b; i++) if (!local.has(i)) need.push(i);
    const hit = need.length === 0;
    const flight = read.inflight && !hit ? read.inflight : null;
    const covered = flight && a >= flight[0] && b <= flight[1];
    const fetchR = covered ? flight : [a, b];

    const phases = [];
    // 1. Check the bitmap.
    phases.push({
      view: { req: [a, b], flight: flight && covered ? flight : null, text: hit
        ? `Check the bitmap: ${rng(a, b)} ${a === b ? 'is' : 'are all'} local. This is a cache hit.`
        : `Check the bitmap: ${need.length === b - a + 1 ? `${rng(a, b)} ${a === b ? 'is' : 'are'} not local` : `${rng(need[0], need[need.length - 1])} ${need.length === 1 ? 'is' : 'are'} not local`}. Even one missing block means the whole covering range, ${rng(a, b)}, is fetched${need.length !== b - a + 1 ? ', including the blocks that are already local' : ''}.`,
      },
    });
    if (!hit) {
      if (covered) {
        phases.push({
          view: { req: [a, b], flight, text: `Another read in the batch is already fetching ${rng(flight[0], flight[1])}, which covers ${rng(a, b)}. This read waits for that request instead of sending its own.` },
        });
      } else {
        phases.push({
          view: { req: [a, b], own: [a, b], arrow: [a, b, `fetch ${rng(a, b)}`], text: `Send one request to object storage for ${rng(a, b)}. Each round trip takes 10 to 100 ms, so it is worth fetching the whole range at once.` },
        });
      }
      phases.push({
        fill: fetchR,
        view: { req: [a, b], own: covered ? null : [a, b], flight: covered ? flight : null, arrow: [fetchR[0], fetchR[1], covered ? `fetched ${rng(fetchR[0], fetchR[1])}` : `fetched ${rng(a, b)}`], text: `The bytes arrive. Write them into the local mmap and mark ${rng(fetchR[0], fetchR[1])} in the bitmap. Remote files are immutable or append-only, so a fetched block never goes stale.` },
      });
    }
    phases.push({
      view: { req: null, slice: [a, b], text: hit
        ? `Return a slice of the local mmap. No network round trip.`
        : `Return a slice borrowed from the local mmap, not the remote buffer, so hits and misses give the same kind of result.` },
      done: true,
    });

    phases.forEach((p, i) =>
      timers.push(
        setTimeout(() => {
          if (p.fill) for (let k = p.fill[0]; k <= p.fill[1]; k++) local.add(k);
          view = { req: null, slice: null, own: null, flight: null, arrow: null, ...p.view };
          if (p.done && local.size === N) view.text += ' Every block is now local, so the <code>fully_populated</code> flag lets later reads skip the bitmap and its lock.';
          render();
        }, i === 0 ? 0 : i * 1700),
      ),
    );
  }

  readBtns.forEach((btn) => btn.addEventListener('click', () => run(READS.find((r) => r.id === btn.dataset.read))));
  resetBtn.addEventListener('click', () => {
    clearTimers();
    local = new Set(INITIAL);
    selected = null;
    view = { req: null, slice: null, own: null, flight: null, arrow: null, text: STATUS_IDLE };
    render();
  });

  build(false);
  compact = false;
  render();
  layout();
  if (window.ResizeObserver) new ResizeObserver(layout).observe(node);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
