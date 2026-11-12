/*
 * architecture island: the three parts of the Food Discovery demo.
 *
 * A React frontend, a FastAPI backend, and a Qdrant instance, all behind one
 * uvicorn webserver. Step through one search to follow a request.
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
  { id: 'browser', name: "Browser", sub: "React frontend", x: 80 },
  { id: 'uvicorn', name: "uvicorn", sub: "webserver", x: 300 },
  { id: 'fastapi', name: "FastAPI", sub: "backend", x: 520 },
  { id: 'qdrant', name: "Qdrant", sub: "local or cloud", x: 740 },
];
const A = Object.fromEntries(ACTORS.map((a) => [a.id, a]));

const FLOWS = {
  search: {
    label: "Run a search",
    overview: "uvicorn serves the React app at <code>/</code> and routes requests to <code>/api/*</code> to the FastAPI backend, which is the only part that talks to Qdrant. Step through a search to follow a request.",
    steps: [
      { from: 'browser', to: 'uvicorn', label: "request to /api/*", text: "The React frontend sends a request to <code>/api/*</code> on the same webserver." },
      { from: 'uvicorn', to: 'fastapi', label: "forward the request", text: "uvicorn routes everything under <code>/api/*</code> to the FastAPI backend." },
      { from: 'fastapi', to: 'qdrant', label: "query the collection", text: "The backend embeds text with CLIP if needed and queries Qdrant, which runs either locally or in the cloud." },
      { from: 'qdrant', to: 'fastapi', label: "points", ret: true, text: "Qdrant returns the matching dishes with their payload." },
      { from: 'fastapi', to: 'uvicorn', label: "results", ret: true, text: "The backend turns the points into a response." },
      { from: 'uvicorn', to: 'browser', label: "JSON response", ret: true, text: "uvicorn returns the response and the frontend shows the dishes." },
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
  node.classList.add('qi-fa');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    '      <button type="button" class="qi-chip qi-fa__prev">Previous</button>',
    '      <button type="button" class="qi-chip qi-fa__next">Next</button>',
    '    </div>',
    '  </div>',
    '  <div class="qi-fa__stage"></div>',
    '  <p class="qi-status qi-status--3 qi-fa__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const stage = node.querySelector('.qi-fa__stage');
  const statusEl = node.querySelector('.qi-fa__status');
  const prevBtn = node.querySelector('.qi-fa__prev');
  const nextBtn = node.querySelector('.qi-fa__next');

  let flow = 'search';
  let step = null; // index into steps, or null for the overview
  let narrow = null;

  function drawWide() {
    const f = FLOWS[flow];
    const H = TOP + f.steps.length * ROW_H + 20;
    const svg = el('svg', {
      class: 'qi-svg qi-fa__svg',
      viewBox: `0 0 ${VB_W} ${H}`,
      role: 'img',
      'aria-label': "A sequence diagram with four participants: the browser running the React frontend, the uvicorn webserver, the FastAPI backend, and the Qdrant server.",
    });
    const defs = el('defs');
    ACTORS.forEach((a) => {
      defs.appendChild(
        el('marker', { id: `qi-fa-head-${a.id}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' })
          .appendChild(el('path', { class: `qi-fa__head qi-fa__c--${a.id}`, d: 'M0 0L9 5L0 10Z' })).parentNode,
      );
    });
    svg.appendChild(defs);

    ACTORS.forEach((a) => {
      svg.appendChild(el('line', { class: 'qi-fa__life', x1: a.x, y1: HEAD_H, x2: a.x, y2: H - 8 }));
      const g = el('g', { class: `qi-fa__actor qi-fa__c--${a.id}` });
      g.appendChild(el('rect', { class: 'qi-fa__pill', x: a.x - 76, y: 4, width: 152, height: HEAD_H - 8, rx: 6 }));
      g.appendChild(el('text', { class: 'qi-fa__pill-name', x: a.x, y: 25, 'text-anchor': 'middle' }, a.name));
      g.appendChild(el('text', { class: 'qi-label', x: a.x, y: 43, 'text-anchor': 'middle' }, a.sub));
      svg.appendChild(g);
    });

    f.steps.forEach((s, i) => {
      const y = TOP + i * ROW_H;
      const x1 = A[s.from].x;
      const x2 = A[s.to].x;
      const dir = x2 > x1 ? 1 : -1;
      const g = el('g', { class: `qi-fa__msg qi-fa__c--${s.from}`, 'data-step': i, tabindex: '0', role: 'button', 'aria-label': `Step ${i + 1}: ${s.label}` });
      g.appendChild(el('rect', { class: 'qi-fa__hit', x: Math.min(x1, x2) - 8, y: y - 30, width: Math.abs(x2 - x1) + 16, height: 40, fill: 'transparent' }));
      g.appendChild(el('line', { class: `qi-fa__arrow${s.ret ? ' is-return' : ''}`, x1: x1 + dir * 6, y1: y, x2: x2 - dir * 6, y2: y, 'marker-end': `url(#qi-fa-head-${s.from})` }));
      // The number sits on the same line as the label: badge, gap, text, centered as one unit.
      const unitW = 28 + s.label.length * 8.4;
      const startX = (x1 + x2) / 2 - unitW / 2;
      g.appendChild(el('circle', { class: 'qi-fa__num', cx: startX + 11, cy: y - 13, r: 11 }));
      g.appendChild(el('text', { class: 'qi-fa__num-text', x: startX + 11, y: y - 9, 'text-anchor': 'middle' }, String(i + 1)));
      g.appendChild(el('text', { class: 'qi-fa__msg-label', x: startX + 28, y: y - 8, 'text-anchor': 'start' }, s.label));
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
    ol.className = 'qi-fa__list';
    f.steps.forEach((s, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `qi-fa__step qi-fa__c--${s.from}`;
      b.dataset.step = String(i);
      b.innerHTML =
        `<span class="qi-fa__badge">${i + 1}</span>` +
        `<span class="qi-fa__path"><b>${A[s.from].name}</b> to <b>${A[s.to].name}</b></span>` +
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
    prevBtn.disabled = step === null;
    nextBtn.disabled = step === f.steps.length - 1;
    statusEl.innerHTML = step === null ? f.overview : `<b>Step ${step + 1} of ${f.steps.length}.</b> ${f.steps[step].text}`;
  }

  function select(i) {
    step = i;
    render();
  }

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
