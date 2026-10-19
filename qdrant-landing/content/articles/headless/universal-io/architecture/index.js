/*
 * Universal I/O architecture island for articles/universal-io.
 *
 * One consumer layer, one set of traits, three backends. The reader picks a
 * backend to see what sits underneath the same consumer code, and "Send reads"
 * schedules reads into each backend's pipeline: the slots fill as reads are
 * scheduled and drain as wait() returns them. Pipeline depths come from the
 * article (mmap 1, io_uring 16, network up to 256); the network box draws only
 * 16 of its 256 slots. Tick speed is illustrative, not a latency measurement.
 *
 * Two compositions share one state: a wide one (viewBox 760 wide) and a compact
 * portrait one (viewBox 360 wide) used when the island is narrower than
 * COMPACT_BELOW px, so labels stay near their real size on a phone. Pure SVG +
 * CSS on the shared island design system (islands.scss).
 */

let instanceId = 0;
const NS = 'http://www.w3.org/2000/svg';
const COMPACT_BELOW = 560;

const BACKENDS = [
  { id: 'mmap', title: 'mmap', sub: 'synchronous', depth: 1, shown: 1, depthLabel: 'depth 1' },
  { id: 'uring', title: 'io_uring', sub: 'queued', depth: 16, shown: 16, depthLabel: 'depth 16' },
  { id: 'net', title: 'Network I/O', sub: 'asynchronous', depth: 256, shown: 16, depthLabel: 'depth up to 256', note: '16 of 256 slots drawn', noteShort: '16 of 256 drawn' },
];

const STATUS = {
  none: 'The consumers are written once against the traits. Pick a backend to see what runs underneath, or send reads to all three.',
  mmap: '<code>mmap</code> has depth 1: <code>schedule()</code> slices the mapped file and <code>wait()</code> hands the slice back, so it is synchronous. Cheap when the data is in RAM, but a cold read blocks on a page fault, around 100 µs on an SSD.',
  uring: '<code>io_uring</code> has depth 16: reads queue up and run concurrently, but only on recent Linux kernels. A full pipeline accepts no more reads until <code>wait()</code> returns one.',
  net: 'Network I/O has depth up to 256: each read is an async request, 10 to 100 ms per round trip when the data is not cached, so many have to be in flight at once.',
};

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-ab');
  const arrowId = `qi-ab-arrow-${++instanceId}`;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <span class="qi-hint">Backend:</span>',
    BACKENDS.map(
      (b) => `<button type="button" class="qi-chip" data-backend-btn="${b.id}" aria-pressed="false"><span class="qi-chip__swatch qi-ab__swatch--${b.id}"></span>${b.title}</button>`,
    ).join(''),
    '    </div>',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-send>Send reads</button>',
    '      <button type="button" class="qi-chip" data-reset>Reset</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-ab__svg" viewBox="0 0 760 430" role="img"',
    '    aria-label="Universal I/O architecture. Consumer code (vector storage, HNSW graph links, payload indexes) calls the Universal I/O traits, which are implemented by three backends: mmap with pipeline depth 1, io_uring with depth 16, and network I/O with depth up to 256.">',
    '    <defs>',
    `      <marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">`,
    '        <path class="qi-ab__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    '    <g class="qi-ab__layer"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--3 qi-ab__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-ab__svg');
  const layer = node.querySelector('.qi-ab__layer');
  const statusEl = node.querySelector('.qi-ab__status');
  const backendBtns = [...node.querySelectorAll('[data-backend-btn]')];
  const sendBtn = node.querySelector('[data-send]');
  const resetBtn = node.querySelector('[data-reset]');

  // ── State shared by both compositions ──
  let selected = null;
  let timers = [];
  const filled = { mmap: 0, uring: 0, net: 0 };
  let boxes = {};
  let wires = {};
  let cells = {};
  let compact = null;

  const text = (x, y, s, cls, anchor) => el('text', { class: cls, x, y, ...(anchor ? { 'text-anchor': anchor } : {}) }, s);
  const rect = (x, y, w, h, cls) => el('rect', { class: cls, x, y, width: w, height: h, rx: 6 });
  const arrowPath = (d, cls, extra) => el('path', { class: cls, d, 'marker-end': `url(#${arrowId})`, ...extra });

  function build(isCompact) {
    layer.replaceChildren();
    boxes = {};
    wires = {};
    cells = {};

    // The two compositions differ only in geometry; everything is keyed by backend id.
    const g = isCompact
      ? {
          W: 360, H: 520, cx: 180,
          cons: { x: 8, y: 8, w: 344, h: 80 },
          traits: { x: 8, y: 108, w: 344, h: 92 },
          consLines: ['vectors · HNSW · payload indexes', 'written once, any backend'],
          traitLines: ['UniversalReadFs', 'UniversalRead · ReadPipeline', 'schedule() · wait()'],
          consWire: 'M 180 88 V 104',
          box: (i) => ({ x: 44, y: 222 + i * 100, w: 308, h: 88 }),
          wire: (i) => ({ d: `M 24 ${i === 0 ? 200 : 222 + (i - 1) * 100 + 44} V ${222 + i * 100 + 44} H 40` }),
          cell: { w: 12, gap: 3, h: 14 },
        }
      : {
          W: 760, H: 430, cx: 380,
          cons: { x: 130, y: 10, w: 500, h: 76 },
          traits: { x: 130, y: 132, w: 500, h: 84 },
          consLines: ['vectors · HNSW links · payload indexes', 'written once, generic over the backend'],
          traitLines: ['UniversalReadFs · UniversalRead · ReadPipeline', 'schedule() · wait()'],
          consWire: 'M 380 86 V 128',
          box: (i) => ({ x: 16 + i * 248, y: 290, w: 232, h: 132 }),
          wire: (i) => ({ d: `M 380 216 V 254 H ${16 + i * 248 + 116} V 286` }),
          cell: { w: 10, gap: 3, h: 14 },
        };

    svg.setAttribute('viewBox', `0 0 ${g.W} ${g.H}`);

    // Consumers and traits.
    const { cons, traits } = g;
    layer.appendChild(rect(cons.x, cons.y, cons.w, cons.h, 'qi-ab__box'));
    layer.appendChild(text(g.cx, cons.y + 24, 'Consumers', 'qi-title', 'middle'));
    layer.appendChild(text(g.cx, cons.y + 44, g.consLines[0], 'qi-label qi-label--strong', 'middle'));
    layer.appendChild(text(g.cx, cons.y + 63, g.consLines[1], 'qi-label', 'middle'));

    layer.appendChild(rect(traits.x, traits.y, traits.w, traits.h, 'qi-ab__box qi-ab__box--traits'));
    layer.appendChild(text(g.cx, traits.y + 24, 'Universal I/O traits', 'qi-title', 'middle'));
    g.traitLines.forEach((line, k) => {
      const last = k === g.traitLines.length - 1;
      layer.appendChild(text(g.cx, traits.y + 45 + k * 19, line, last ? 'qi-label' : 'qi-label qi-label--strong', 'middle'));
    });
    layer.appendChild(arrowPath(g.consWire, 'qi-ab__wire'));

    // Wires from the traits to each backend.
    BACKENDS.forEach((b, i) => {
      const w = arrowPath(g.wire(i).d, `qi-ab__wire qi-ab__wire--${b.id}`, { 'data-backend': b.id });
      wires[b.id] = w;
      layer.appendChild(w);
    });

    // Backends.
    BACKENDS.forEach((b, i) => {
      const r = g.box(i);
      const grp = el('g', { class: `qi-ab__backend qi-ab__backend--${b.id}` });
      grp.appendChild(rect(r.x, r.y, r.w, r.h, 'qi-ab__box-rect'));
      grp.appendChild(text(r.x + 14, r.y + 26, b.title, 'qi-title'));
      if (isCompact) {
        grp.appendChild(text(r.x + r.w - 14, r.y + 26, b.sub, 'qi-label', 'end'));
      } else {
        grp.appendChild(text(r.x + 14, r.y + 48, b.sub, 'qi-label'));
      }
      const cellY = r.y + (isCompact ? 40 : 62);
      cells[b.id] = [];
      for (let k = 0; k < b.shown; k++) {
        const c = el('rect', { class: 'qi-ab__cell', x: r.x + 14 + k * (g.cell.w + g.cell.gap), y: cellY, width: g.cell.w, height: g.cell.h, rx: 2 });
        cells[b.id].push(c);
        grp.appendChild(c);
      }
      if (isCompact) {
        grp.appendChild(text(r.x + 14, r.y + 78, b.depthLabel, 'qi-label qi-label--strong'));
        if (b.noteShort) grp.appendChild(text(r.x + r.w - 14, r.y + 78, b.noteShort, 'qi-label', 'end'));
      } else {
        grp.appendChild(text(r.x + 14, r.y + 104, b.depthLabel, 'qi-label qi-label--strong'));
        if (b.note) grp.appendChild(text(r.x + 14, r.y + 122, b.note, 'qi-label'));
      }
      boxes[b.id] = grp;
      layer.appendChild(grp);
    });
  }

  const clearTimers = () => {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
  };
  const setCells = (id, count) => {
    filled[id] = count;
    cells[id].forEach((c, i) => c.classList.toggle('is-full', i < count));
  };
  const resetCells = () => BACKENDS.forEach((b) => setCells(b.id, 0));

  function render() {
    backendBtns.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.backendBtn === selected)));
    node.classList.toggle('has-selection', selected !== null);
    BACKENDS.forEach((b) => {
      const on = selected === b.id;
      boxes[b.id].classList.toggle('is-on', on);
      wires[b.id].classList.toggle('is-on', on);
      // Bring the selected wire to the front so a shared trunk is not tinted by dimmed ones.
      if (on) layer.appendChild(wires[b.id]);
      setCells(b.id, filled[b.id]);
    });
    statusEl.innerHTML = STATUS[selected || 'none'];
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

  // Schedule fills slots one tick at a time, then wait() drains them.
  const TICK = 110;
  function send() {
    clearTimers();
    resetCells();
    const targets = BACKENDS.filter((b) => selected === null || b.id === selected);
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    targets.forEach((b) => {
      if (reduced) {
        setCells(b.id, b.shown);
        timers.push(setTimeout(() => setCells(b.id, 0), 1500));
        return;
      }
      for (let i = 1; i <= b.shown; i++) timers.push(setTimeout(() => setCells(b.id, i), i * TICK));
      const hold = (b.shown + 4) * TICK;
      for (let i = 1; i <= b.shown; i++) timers.push(setTimeout(() => setCells(b.id, b.shown - i), hold + i * TICK * 1.5));
    });
  }

  backendBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      // Pressing the active backend again returns to the overview.
      selected = selected === btn.dataset.backendBtn ? null : btn.dataset.backendBtn;
      clearTimers();
      resetCells();
      render();
    }),
  );
  sendBtn.addEventListener('click', send);
  resetBtn.addEventListener('click', () => {
    selected = null;
    clearTimers();
    resetCells();
    render();
  });

  build(false);
  compact = false;
  render();
  layout();
  if (window.ResizeObserver) new ResizeObserver(layout).observe(node);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
