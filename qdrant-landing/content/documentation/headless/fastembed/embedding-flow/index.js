/*
 * embedding-flow island: what happens when qdrant-client embeds with FastEmbed.
 *
 * Two flows share one drawing: index time (upload_collection with
 * models.Document) and query time (query_points with models.Document). With
 * local inference, qdrant-client runs FastEmbed inside your Python process,
 * then sends the vectors to Qdrant. Pick a flow, then step through it.
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
  { id: 'code', name: 'Your code', sub: 'Python process', x: 80 },
  { id: 'client', name: 'qdrant-client', sub: 'Python process', x: 300 },
  { id: 'fastembed', name: 'FastEmbed', sub: 'embedding model', x: 520 },
  { id: 'qdrant', name: 'Qdrant', sub: 'collection', x: 740 },
];
const A = Object.fromEntries(ACTORS.map((a) => [a.id, a]));

const FLOWS = {
  index: {
    label: 'Index time',
    overview:
      '<b>Index time</b>: with <code>models.Document</code>, qdrant-client embeds your texts with FastEmbed in your Python process, then uploads the vectors. Step through it to see who does what.',
    steps: [
      { from: 'code', to: 'client', label: 'upload_collection(...)', text: 'Your code calls <code>upload_collection</code> with <code>models.Document</code> objects instead of vectors.' },
      { from: 'client', to: 'fastembed', label: 'embed documents', text: 'qdrant-client passes the texts to FastEmbed, which runs in your Python process.' },
      { from: 'fastembed', to: 'client', label: 'vectors', ret: true, text: 'FastEmbed returns one vector per document.' },
      { from: 'client', to: 'qdrant', label: 'store the points', text: 'qdrant-client uploads the vectors and the payload to the Qdrant collection.' },
      { from: 'qdrant', to: 'client', label: 'confirm storage', ret: true, text: 'Qdrant confirms the points are stored. You never call the embedding model yourself.' },
    ],
  },
  query: {
    label: 'Query time',
    overview:
      '<b>Query time</b>: a <code>models.Document</code> query is embedded the same way before the search. Step through it to see who does what.',
    steps: [
      { from: 'code', to: 'client', label: 'query_points(...)', text: 'Your code calls <code>query_points</code> with a <code>models.Document</code> as the query.' },
      { from: 'client', to: 'fastembed', label: 'embed the query', text: 'qdrant-client passes the query text to FastEmbed.' },
      { from: 'fastembed', to: 'client', label: 'query vector', ret: true, text: 'FastEmbed returns the query vector. The model that embedded your documents must also embed the query.' },
      { from: 'client', to: 'qdrant', label: 'search the vectors', text: 'qdrant-client sends the vector to the collection, which searches the stored vectors.' },
      { from: 'qdrant', to: 'client', label: 'results + payload', ret: true, text: 'Qdrant returns the closest points with their payload, and the client hands them to your code.' },
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
  node.classList.add('qi-fe');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group" role="group" aria-label="Flow">',
    Object.entries(FLOWS)
      .map(([id, f]) => `<button type="button" class="qi-chip qi-fe__flow" data-flow="${id}" aria-pressed="false">${f.label}</button>`)
      .join(''),
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Step">',
    '      <button type="button" class="qi-chip qi-fe__prev">Previous</button>',
    '      <button type="button" class="qi-chip qi-fe__next">Next</button>',
    '    </div>',
    '  </div>',
    '  <div class="qi-fe__stage"></div>',
    '  <p class="qi-status qi-status--3 qi-fe__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const stage = node.querySelector('.qi-fe__stage');
  const statusEl = node.querySelector('.qi-fe__status');
  const flowBtns = [...node.querySelectorAll('.qi-fe__flow')];
  const prevBtn = node.querySelector('.qi-fe__prev');
  const nextBtn = node.querySelector('.qi-fe__next');

  let flow = 'index';
  let step = null; // index into steps, or null for the overview
  let narrow = null;

  function drawWide() {
    const f = FLOWS[flow];
    const H = TOP + f.steps.length * ROW_H + 20;
    const svg = el('svg', {
      class: 'qi-svg qi-fe__svg',
      viewBox: `0 0 ${VB_W} ${H}`,
      role: 'img',
      'aria-label': 'A sequence diagram with four participants: your code, qdrant-client, FastEmbed, and the Qdrant collection.',
    });
    const defs = el('defs');
    ACTORS.forEach((a) => {
      defs.appendChild(
        el('marker', { id: `qi-fe-head-${a.id}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' })
          .appendChild(el('path', { class: `qi-fe__head qi-fe__c--${a.id}`, d: 'M0 0L9 5L0 10Z' })).parentNode,
      );
    });
    svg.appendChild(defs);

    ACTORS.forEach((a) => {
      svg.appendChild(el('line', { class: 'qi-fe__life', x1: a.x, y1: HEAD_H, x2: a.x, y2: H - 8 }));
      const g = el('g', { class: `qi-fe__actor qi-fe__c--${a.id}` });
      g.appendChild(el('rect', { class: 'qi-fe__pill', x: a.x - 76, y: 4, width: 152, height: HEAD_H - 8, rx: 6 }));
      g.appendChild(el('text', { class: 'qi-fe__pill-name', x: a.x, y: 25, 'text-anchor': 'middle' }, a.name));
      g.appendChild(el('text', { class: 'qi-label', x: a.x, y: 43, 'text-anchor': 'middle' }, a.sub));
      svg.appendChild(g);
    });

    f.steps.forEach((s, i) => {
      const y = TOP + i * ROW_H;
      const x1 = A[s.from].x;
      const x2 = A[s.to].x;
      const dir = x2 > x1 ? 1 : -1;
      const g = el('g', { class: `qi-fe__msg qi-fe__c--${s.from}`, 'data-step': i, tabindex: '0', role: 'button', 'aria-label': `Step ${i + 1}: ${s.label}` });
      g.appendChild(el('rect', { class: 'qi-fe__hit', x: Math.min(x1, x2) - 8, y: y - 30, width: Math.abs(x2 - x1) + 16, height: 40, fill: 'transparent' }));
      g.appendChild(el('line', { class: `qi-fe__arrow${s.ret ? ' is-return' : ''}`, x1: x1 + dir * 6, y1: y, x2: x2 - dir * 6, y2: y, 'marker-end': `url(#qi-fe-head-${s.from})` }));
      // The number sits on the same line as the label: badge, gap, text, centered as one unit.
      const unitW = 28 + s.label.length * 8.4;
      const startX = (x1 + x2) / 2 - unitW / 2;
      g.appendChild(el('circle', { class: 'qi-fe__num', cx: startX + 11, cy: y - 13, r: 11 }));
      g.appendChild(el('text', { class: 'qi-fe__num-text', x: startX + 11, y: y - 9, 'text-anchor': 'middle' }, String(i + 1)));
      g.appendChild(el('text', { class: 'qi-fe__msg-label', x: startX + 28, y: y - 8, 'text-anchor': 'start' }, s.label));
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
    ol.className = 'qi-fe__list';
    f.steps.forEach((s, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `qi-fe__step qi-fe__c--${s.from}`;
      b.dataset.step = String(i);
      b.innerHTML =
        `<span class="qi-fe__badge">${i + 1}</span>` +
        `<span class="qi-fe__path"><b>${A[s.from].name}</b> to <b>${A[s.to].name}</b></span>` +
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
