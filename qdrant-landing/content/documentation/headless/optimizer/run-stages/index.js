/*
 * run-stages island: the three stages of each optimizer benchmark run.
 *
 * A matrix of what is active in each stage: writes, search traffic, optimizers,
 * and the latency that gets measured. Upload writes every point with no search
 * traffic. Draining runs search continuously while the optimizers clear their
 * backlog. Steady measures the baseline once the optimizers are idle.
 * Selecting a stage focuses its column and explains it.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Wide
 * containers lay the stages out side by side; narrow ones stack them.
 */

const NS = 'http://www.w3.org/2000/svg';

const NARROW_PX = 560; // container width below which the stages stack
const LABEL_W = 96; // row-label column (wide layout)
const FRAME_W = 208; // stage frame width (wide layout)
const FRAME_GAP = 8;
const NARROW_W = 340; // stage frame width (narrow layout)
const NARROW_GAP = 16;
const HEAD_H = 56;
const CELL_H = 40;
const CELL_GAP = 8;
const FRAME_H = HEAD_H + 4 * (CELL_H + CELL_GAP);

// kind: which lane the cell belongs to, and whether it is active, partial, or off.
const ROWS = ['Writes', 'Search', 'Optimizers', 'Latency'];
const STAGES = [
  {
    id: 'upload',
    title: 'Upload',
    sub: 'bulk load',
    cells: [
      { text: 'all points written', tone: 'write' },
      { text: 'no search traffic', tone: 'off' },
      { text: 'indexing, if enabled', tone: 'partial' },
      { text: 'not measured', tone: 'off' },
    ],
    status:
      '<b>Upload</b>: every point is written as batches and no search traffic runs. Upload alone took 70 to 316 seconds, depending on whether indexing ran at the same time.',
  },
  {
    id: 'draining',
    title: 'Draining',
    sub: 'search and maintenance',
    cells: [
      { text: 'none', tone: 'off' },
      { text: 'one query at a time', tone: 'search' },
      { text: 'index, merge, vacuum', tone: 'optim' },
      { text: 'draining p50, p95', tone: 'metric' },
    ],
    status:
      '<b>Draining</b>: search runs continuously while the index, merge, and vacuum optimizers work through the backlog. The stage ends when Qdrant reports nothing running and nothing queued.',
  },
  {
    id: 'steady',
    title: 'Steady',
    sub: 'stable search baseline',
    cells: [
      { text: 'none', tone: 'off' },
      { text: '5,000 fixed queries', tone: 'search' },
      { text: 'idle', tone: 'off' },
      { text: 'steady p50, p95', tone: 'metric' },
    ],
    status:
      '<b>Steady</b>: with the optimizers confirmed idle, five passes over 1,000 fixed queries (5,000 searches) set the baseline latency.',
  },
];

const OVERVIEW =
  'Each run goes through three stages, from the last point uploaded to a settled baseline. Select a stage to see what runs in it.';

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-ol');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Benchmark stage">',
    STAGES.map(
      (s) =>
        `<button type="button" class="qi-chip qi-ol__chip" data-stage="${s.id}" aria-pressed="false">${s.title}</button>`,
    ).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-ol__svg" role="img"',
    '    aria-label="What runs in each stage of a benchmark run. Upload writes every point with no search traffic. Draining runs search while the index, merge, and vacuum optimizers clear their backlog. Steady measures baseline latency once the optimizers are idle.">',
    '  </svg>',
    '  <p class="qi-status qi-status--3 qi-ol__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-ol__svg');
  const statusEl = node.querySelector('.qi-ol__status');
  const chips = [...node.querySelectorAll('.qi-ol__chip')];

  let selected = null;
  let narrow = null;
  let groups = [];

  function build() {
    svg.replaceChildren();
    groups = [];
    const frameW = narrow ? NARROW_W : FRAME_W;
    const cellX = narrow ? 100 : 8;
    const cellW = narrow ? NARROW_W - 100 - 8 : FRAME_W - 16;
    const x0 = narrow ? 0 : LABEL_W + FRAME_GAP;
    const width = narrow ? NARROW_W : x0 + 3 * FRAME_W + 2 * FRAME_GAP;
    const height = narrow ? 3 * FRAME_H + 2 * NARROW_GAP : FRAME_H;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    node.dataset.layout = narrow ? 'column' : 'row';

    // Row labels sit once at the left on wide layouts, inside each stage when stacked.
    if (!narrow) {
      ROWS.forEach((r, i) => {
        const y = HEAD_H + i * (CELL_H + CELL_GAP) + CELL_H / 2 + 5;
        svg.appendChild(el('text', { class: 'qi-label qi-ol__row', x: 0, y }, r));
      });
    }

    STAGES.forEach((s, si) => {
      const g = el('g', {
        class: 'qi-ol__stage',
        'data-stage': s.id,
        transform: narrow ? `translate(0 ${si * (FRAME_H + NARROW_GAP)})` : `translate(${x0 + si * (FRAME_W + FRAME_GAP)} 0)`,
      });
      g.appendChild(el('rect', { class: 'qi-frame qi-ol__frame', x: 0, y: 0, width: frameW, height: FRAME_H, rx: 6 }));
      g.appendChild(el('text', { class: 'qi-ol__name', x: 16, y: 26 }, s.title));
      g.appendChild(el('text', { class: 'qi-label', x: 16, y: 45 }, s.sub));
      s.cells.forEach((c, i) => {
        const y = HEAD_H + i * (CELL_H + CELL_GAP);
        if (narrow) g.appendChild(el('text', { class: 'qi-label qi-ol__row', x: 16, y: y + CELL_H / 2 + 5 }, ROWS[i]));
        g.appendChild(el('rect', { class: `qi-ol__cell qi-ol__cell--${c.tone}`, x: cellX, y, width: cellW, height: CELL_H, rx: 4 }));
        g.appendChild(el('text', { class: `qi-ol__text qi-ol__text--${c.tone}`, x: cellX + 12, y: y + CELL_H / 2 + 5 }, c.text));
      });
      g.addEventListener('click', () => select(s.id));
      groups.push(g);
      svg.appendChild(g);
    });
    render();
  }

  function render() {
    groups.forEach((g) => {
      const id = g.getAttribute('data-stage');
      g.classList.toggle('is-active', id === selected);
      g.classList.toggle('is-dim', selected !== null && id !== selected);
    });
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.stage === selected)));
    statusEl.innerHTML = selected ? STAGES.find((s) => s.id === selected).status : OVERVIEW;
  }

  function select(id) {
    selected = selected === id ? null : id;
    render();
  }

  function layout() {
    const isNarrow = node.clientWidth > 0 && node.clientWidth < NARROW_PX;
    if (isNarrow === narrow) return;
    narrow = isNarrow;
    build();
  }

  chips.forEach((c) => c.addEventListener('click', () => select(c.dataset.stage)));

  layout();
  if (narrow === null) {
    narrow = false;
    build();
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(node);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
