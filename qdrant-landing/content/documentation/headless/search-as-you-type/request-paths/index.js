/*
 * request-paths island: how the search service answers one keystroke.
 *
 * Longer queries are embedded and sent as four prioritized queries in one batch.
 * Short prefixes found in the prefix cache skip the embedding model and use
 * recommend queries with lookup_from. A short prefix missing from the cache runs
 * both paths at once and keeps the first non-empty result.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Wide
 * containers draw a sequence diagram; narrow ones list the same steps.
 */

const NS = 'http://www.w3.org/2000/svg';

const NARROW_PX = 560;
const VB_W = 820;
const HEAD_H = 56;
const ROW_H = 52;
const TOP = HEAD_H + 40;

const ACTORS = [
  { id: 'browser', name: "Browser", sub: "search box", x: 80 },
  { id: 'service', name: "Search service", sub: "your backend", x: 300 },
  { id: 'embedder', name: "Embedding model", sub: "text to vector", x: 520 },
  { id: 'qdrant', name: "Qdrant", sub: "two collections", x: 740 },
];
const A = Object.fromEntries(ACTORS.map((a) => [a.id, a]));

const FLOWS = {
  long: {
    label: "Longer query",
    overview: "A request per keystroke. Pick a query type, then step through what the search service does. Longer queries are embedded first.",
    steps: [
      { from: 'browser', to: 'service', label: "query text", text: "The browser sends the text typed so far to the search service, on almost every keystroke." },
      { from: 'service', to: 'embedder', label: "embed the query", text: "The text is longer than the cached prefixes, so the service embeds it." },
      { from: 'embedder', to: 'service', label: "query vector", ret: true, text: "The embedding model returns the query vector." },
      { from: 'service', to: 'qdrant', label: "batched query", text: "The service sends the four prioritized queries to the <code>site</code> collection in one batch request, all with that vector." },
      { from: 'qdrant', to: 'service', label: "four result lists", ret: true, text: "Qdrant returns one list of points per query." },
      { from: 'service', to: 'browser', label: "merged results", ret: true, text: "The service merges the lists in priority order, drops duplicates, and returns the first five points." },
    ],
  },
  hit: {
    label: "Short, cached",
    overview: "A short prefix that is in the prefix cache is answered without waiting for the embedding model. Step through what the search service does.",
    steps: [
      { from: 'browser', to: 'service', label: "short text", text: "The browser sends a short prefix, for example <code>quan</code>." },
      { from: 'service', to: 'qdrant', label: "batched recommend", text: "The four queries are recommend queries. The positive example is the point ID of the prefix, and <code>lookup_from</code> points to <code>prefix_cache</code>, so Qdrant reads the stored embedding. The service also starts the embedding path as a fallback, but this path answers first and its result is used." },
      { from: 'qdrant', to: 'service', label: "four result lists", ret: true, text: "Qdrant returns one list of points per query." },
      { from: 'service', to: 'browser', label: "merged results", ret: true, text: "The service merges the lists in priority order, drops duplicates, and returns the first five points." },
    ],
  },
  miss: {
    label: "Short, not cached",
    overview: "A short prefix that is not in the cache falls back to embedding. Both paths start together. Step through what happens.",
    steps: [
      { from: 'browser', to: 'service', label: "short text", text: "The browser sends a short prefix that nobody has cached yet." },
      { from: 'service', to: 'qdrant', label: "batched recommend", text: "The service cannot know the prefix is missing, so it starts the cache path: a batched recommend query with <code>lookup_from</code> set to <code>prefix_cache</code>." },
      { from: 'service', to: 'embedder', label: "embed the query", text: "At the same moment, it starts the embedding path instead of waiting for the cache path to fail." },
      { from: 'qdrant', to: 'service', label: "404, not cached", ret: true, text: "Qdrant answers 404, because the prefix has no point in <code>prefix_cache</code>. The service ignores this result." },
      { from: 'embedder', to: 'service', label: "query vector", ret: true, text: "The embedding model returns the query vector." },
      { from: 'service', to: 'qdrant', label: "batched query", text: "The service sends the same four queries with that vector." },
      { from: 'qdrant', to: 'service', label: "four result lists", ret: true, text: "Qdrant returns one list of points per query." },
      { from: 'service', to: 'browser', label: "merged results", ret: true, text: "The first non-empty result wins. Starting both paths together costs a miss only the embedding path, not the cache path plus the embedding path one after the other." },
    ],
  },
};

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-sy');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group" role="group" aria-label="Flow">',
    Object.entries(FLOWS)
      .map(([id, f]) => `<button type="button" class="qi-chip qi-sy__flow" data-flow="${id}" aria-pressed="false">${f.label}</button>`)
      .join(''),
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Step">',
    '      <button type="button" class="qi-chip qi-sy__prev">Previous</button>',
    '      <button type="button" class="qi-chip qi-sy__next">Next</button>',
    '    </div>',
    '  </div>',
    '  <div class="qi-sy__stage"></div>',
    '  <p class="qi-status qi-status--3 qi-sy__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const stage = node.querySelector('.qi-sy__stage');
  const statusEl = node.querySelector('.qi-sy__status');
  const flowBtns = [...node.querySelectorAll('.qi-sy__flow')];
  const prevBtn = node.querySelector('.qi-sy__prev');
  const nextBtn = node.querySelector('.qi-sy__next');

  let flow = 'long';
  let step = null; // index into steps, or null for the overview
  let narrow = null;

  function drawWide() {
    const f = FLOWS[flow];
    const H = TOP + f.steps.length * ROW_H + 20;
    const svg = el('svg', {
      class: 'qi-svg qi-sy__svg',
      viewBox: `0 0 ${VB_W} ${H}`,
      role: 'img',
      'aria-label': "A sequence diagram with four participants: the browser, the search service, the embedding model, and Qdrant with its site and prefix cache collections.",
    });
    const defs = el('defs');
    ACTORS.forEach((a) => {
      defs.appendChild(
        el('marker', { id: `qi-sy-head-${a.id}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' })
          .appendChild(el('path', { class: `qi-sy__head qi-sy__c--${a.id}`, d: 'M0 0L9 5L0 10Z' })).parentNode,
      );
    });
    svg.appendChild(defs);

    ACTORS.forEach((a) => {
      svg.appendChild(el('line', { class: 'qi-sy__life', x1: a.x, y1: HEAD_H, x2: a.x, y2: H - 8 }));
      const g = el('g', { class: `qi-sy__actor qi-sy__c--${a.id}` });
      g.appendChild(el('rect', { class: 'qi-sy__pill', x: a.x - 76, y: 4, width: 152, height: HEAD_H - 8, rx: 6 }));
      g.appendChild(el('text', { class: 'qi-sy__pill-name', x: a.x, y: 25, 'text-anchor': 'middle' }, a.name));
      g.appendChild(el('text', { class: 'qi-label', x: a.x, y: 43, 'text-anchor': 'middle' }, a.sub));
      svg.appendChild(g);
    });

    f.steps.forEach((s, i) => {
      const y = TOP + i * ROW_H;
      const x1 = A[s.from].x;
      const x2 = A[s.to].x;
      const dir = x2 > x1 ? 1 : -1;
      const g = el('g', { class: `qi-sy__msg qi-sy__c--${s.from}`, 'data-step': i, tabindex: '0', role: 'button', 'aria-label': `Step ${i + 1}: ${s.label}` });
      g.appendChild(el('rect', { class: 'qi-sy__hit', x: Math.min(x1, x2) - 8, y: y - 30, width: Math.abs(x2 - x1) + 16, height: 40, fill: 'transparent' }));
      g.appendChild(el('line', { class: `qi-sy__arrow${s.ret ? ' is-return' : ''}`, x1: x1 + dir * 6, y1: y, x2: x2 - dir * 6, y2: y, 'marker-end': `url(#qi-sy-head-${s.from})` }));
      // The number sits on the same line as the label: badge, gap, text, centered as one unit.
      const unitW = 28 + s.label.length * 8.4;
      const startX = (x1 + x2) / 2 - unitW / 2;
      g.appendChild(el('circle', { class: 'qi-sy__num', cx: startX + 11, cy: y - 13, r: 11 }));
      g.appendChild(el('text', { class: 'qi-sy__num-text', x: startX + 11, y: y - 9, 'text-anchor': 'middle' }, String(i + 1)));
      g.appendChild(el('text', { class: 'qi-sy__msg-label', x: startX + 28, y: y - 8, 'text-anchor': 'start' }, s.label));
      const pick = () => select(step === i ? null : i);
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
      svg.appendChild(g);
    });
    stage.replaceChildren(svg);
  }

  function drawNarrow() {
    const f = FLOWS[flow];
    const ol = document.createElement('ol');
    ol.className = 'qi-sy__list';
    f.steps.forEach((s, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `qi-sy__step qi-sy__c--${s.from}`;
      b.dataset.step = String(i);
      b.innerHTML =
        `<span class="qi-sy__badge">${i + 1}</span>` +
        `<span class="qi-sy__path"><b>${A[s.from].name}</b> to <b>${A[s.to].name}</b></span>` +
        `<code>${s.label}</code>`;
      b.addEventListener('click', () => select(step === i ? null : i));
      li.appendChild(b);
      ol.appendChild(li);
    });
    stage.replaceChildren(ol);
  }

  function draw() {
    node.dataset.layout = narrow ? 'column' : 'row';
    if (narrow) drawNarrow();
    else drawWide();
    render();
  }

  function render() {
    const f = FLOWS[flow];
    stage.querySelectorAll('[data-step]').forEach((n) => {
      const i = Number(n.getAttribute('data-step'));
      n.classList.toggle('is-active', step === i);
      n.classList.toggle('is-dim', step !== null && step !== i);
      n.setAttribute('aria-pressed', String(step === i));
    });
    flowBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.flow === flow)));
    prevBtn.disabled = step === null;
    nextBtn.disabled = step === f.steps.length - 1;
    statusEl.innerHTML = step === null ? f.overview : `<b>Step ${step + 1} of ${f.steps.length}.</b> ${f.steps[step].text}`;
  }

  function select(i) {
    step = i;
    render();
  }

  flowBtns.forEach((b) =>
    b.addEventListener('click', () => {
      flow = b.dataset.flow;
      step = null;
      draw();
    }),
  );
  prevBtn.addEventListener('click', () => select(step <= 0 ? null : step - 1));
  nextBtn.addEventListener('click', () => select(step === null ? 0 : step + 1));

  function layout() {
    const isNarrow = node.clientWidth > 0 && node.clientWidth < NARROW_PX;
    if (isNarrow === narrow) return;
    narrow = isNarrow;
    draw();
  }

  layout();
  if (narrow === null) {
    narrow = false;
    draw();
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(node);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
