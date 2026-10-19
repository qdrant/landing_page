/*
 * search-flow island: what one request to the serverless search function does.
 *
 * A visitor calls the Lambda function URL. The function embeds the query with
 * Cohere, searches the Qdrant collection, and returns the closest texts as
 * JSON. Step through the six calls.
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
  { id: 'visitor', name: 'Visitor', sub: 'browser or app', x: 80 },
  { id: 'lambda', name: 'Lambda', sub: 'search function', x: 300 },
  { id: 'cohere', name: 'Cohere', sub: 'embedding API', x: 520 },
  { id: 'qdrant', name: 'Qdrant', sub: 'collection', x: 740 },
];
const A = Object.fromEntries(ACTORS.map((a) => [a.id, a]));

const FLOWS = {
  request: {
    label: 'Search request',
    overview:
      'One search is one Lambda invocation: the function embeds the query with Cohere, searches Qdrant, and returns JSON. Step through it to see each call.',
    steps: [
      { from: 'visitor', to: 'lambda', label: 'search request', text: 'The visitor calls the function URL with the search text in the <code>q</code> query parameter.' },
      { from: 'lambda', to: 'cohere', label: 'embed the query', text: 'The function sends the text to Cohere\'s embed endpoint with the input type <code>search_query</code>.' },
      { from: 'cohere', to: 'lambda', label: 'query vector', ret: true, text: 'Cohere returns one 1024-dimensional vector for the query.' },
      { from: 'lambda', to: 'qdrant', label: 'query the collection', text: 'The function queries the Qdrant collection with that vector and asks for the payload.' },
      { from: 'qdrant', to: 'lambda', label: 'points + payload', ret: true, text: 'Qdrant returns the five closest points, each with its stored text.' },
      { from: 'lambda', to: 'visitor', label: 'JSON results', ret: true, text: 'The function returns the texts and their scores as JSON.' },
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
  node.classList.add('qi-sl');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    '      <button type="button" class="qi-chip qi-sl__prev">Previous</button>',
    '      <button type="button" class="qi-chip qi-sl__next">Next</button>',
    '    </div>',
    '  </div>',
    '  <div class="qi-sl__stage"></div>',
    '  <p class="qi-status qi-status--3 qi-sl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const stage = node.querySelector('.qi-sl__stage');
  const statusEl = node.querySelector('.qi-sl__status');
  const prevBtn = node.querySelector('.qi-sl__prev');
  const nextBtn = node.querySelector('.qi-sl__next');

  let flow = 'request';
  let step = null; // index into steps, or null for the overview
  let narrow = null;

  function drawWide() {
    const f = FLOWS[flow];
    const H = TOP + f.steps.length * ROW_H + 20;
    const svg = el('svg', {
      class: 'qi-svg qi-sl__svg',
      viewBox: `0 0 ${VB_W} ${H}`,
      role: 'img',
      'aria-label': 'A sequence diagram with four participants: a visitor, the Lambda search function, Cohere, and the Qdrant collection.',
    });
    const defs = el('defs');
    ACTORS.forEach((a) => {
      defs.appendChild(
        el('marker', { id: `qi-sl-head-${a.id}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' })
          .appendChild(el('path', { class: `qi-sl__head qi-sl__c--${a.id}`, d: 'M0 0L9 5L0 10Z' })).parentNode,
      );
    });
    svg.appendChild(defs);

    ACTORS.forEach((a) => {
      svg.appendChild(el('line', { class: 'qi-sl__life', x1: a.x, y1: HEAD_H, x2: a.x, y2: H - 8 }));
      const g = el('g', { class: `qi-sl__actor qi-sl__c--${a.id}` });
      g.appendChild(el('rect', { class: 'qi-sl__pill', x: a.x - 76, y: 4, width: 152, height: HEAD_H - 8, rx: 6 }));
      g.appendChild(el('text', { class: 'qi-sl__pill-name', x: a.x, y: 25, 'text-anchor': 'middle' }, a.name));
      g.appendChild(el('text', { class: 'qi-label', x: a.x, y: 43, 'text-anchor': 'middle' }, a.sub));
      svg.appendChild(g);
    });

    f.steps.forEach((s, i) => {
      const y = TOP + i * ROW_H;
      const x1 = A[s.from].x;
      const x2 = A[s.to].x;
      const dir = x2 > x1 ? 1 : -1;
      const g = el('g', { class: `qi-sl__msg qi-sl__c--${s.from}`, 'data-step': i, tabindex: '0', role: 'button', 'aria-label': `Step ${i + 1}: ${s.label}` });
      g.appendChild(el('rect', { class: 'qi-sl__hit', x: Math.min(x1, x2) - 8, y: y - 30, width: Math.abs(x2 - x1) + 16, height: 40, fill: 'transparent' }));
      g.appendChild(el('line', { class: `qi-sl__arrow${s.ret ? ' is-return' : ''}`, x1: x1 + dir * 6, y1: y, x2: x2 - dir * 6, y2: y, 'marker-end': `url(#qi-sl-head-${s.from})` }));
      // The number sits on the same line as the label: badge, gap, text, centered as one unit.
      const unitW = 28 + s.label.length * 8.4;
      const startX = (x1 + x2) / 2 - unitW / 2;
      g.appendChild(el('circle', { class: 'qi-sl__num', cx: startX + 11, cy: y - 13, r: 11 }));
      g.appendChild(el('text', { class: 'qi-sl__num-text', x: startX + 11, y: y - 9, 'text-anchor': 'middle' }, String(i + 1)));
      g.appendChild(el('text', { class: 'qi-sl__msg-label', x: startX + 28, y: y - 8, 'text-anchor': 'start' }, s.label));
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
    ol.className = 'qi-sl__list';
    f.steps.forEach((s, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `qi-sl__step qi-sl__c--${s.from}`;
      b.dataset.step = String(i);
      b.innerHTML =
        `<span class="qi-sl__badge">${i + 1}</span>` +
        `<span class="qi-sl__path"><b>${A[s.from].name}</b> to <b>${A[s.to].name}</b></span>` +
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
