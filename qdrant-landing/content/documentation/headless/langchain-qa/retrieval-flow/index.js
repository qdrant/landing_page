/*
 * retrieval-flow island: one question answered with LangChain, Qdrant, and an LLM.
 *
 * LangChain embeds the question, asks Qdrant for the nearest stored facts, puts
 * them into a prompt, and lets the chat model write the answer. Step through the
 * eight calls.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Wide
 * containers draw a sequence diagram; narrow ones list the same steps.
 */

const NS = 'http://www.w3.org/2000/svg';

const NARROW_PX = 560;
const VB_W = 800;
const HEAD_H = 56;
const ROW_H = 46;
const TOP = HEAD_H + 40;

const ACTORS = [
  { id: 'user', name: "User", sub: "asks a question", x: 80 },
  { id: 'langchain', name: "LangChain", sub: "orchestrator", x: 240 },
  { id: 'embedding', name: "Embedding model", sub: "text to vector", x: 400 },
  { id: 'qdrant', name: "Qdrant", sub: "collection", x: 560 },
  { id: 'llm', name: "LLM", sub: "writes the answer", x: 720 },
];
const A = Object.fromEntries(ACTORS.map((a) => [a.id, a]));

const FLOWS = {
  answer: {
    label: "Retrieval-augmented answer",
    overview: "One question, eight steps: LangChain orchestrates, Qdrant retrieves, and the LLM writes the answer. Step through it to see what moves where.",
    steps: [
      { from: 'user', to: 'langchain', label: "Question", text: "The user asks a question, for example <code>what is the capital of France?</code>" },
      { from: 'langchain', to: 'embedding', label: "Question", text: "LangChain passes the question to the embedding model, the same one that embedded the facts." },
      { from: 'embedding', to: 'langchain', label: "Question vector", ret: true, text: "The embedding model returns the question as a vector." },
      { from: 'langchain', to: 'qdrant', label: "Question vector", text: "LangChain asks Qdrant for the stored facts closest to that vector." },
      { from: 'qdrant', to: 'langchain', label: "Top K facts", ret: true, text: "Qdrant returns the nearest stored context, the top K facts." },
      { from: 'langchain', to: 'llm', label: "Prompt with top K facts", text: "LangChain builds a prompt that contains the facts and the question, and sends it to the chat model." },
      { from: 'llm', to: 'langchain', label: "Answer", ret: true, text: "The chat model writes an answer from the facts in the prompt." },
      { from: 'langchain', to: 'user', label: "Answer", ret: true, text: "LangChain hands the answer back to the user. Steps 2 to 5 are retrieval: the LLM only sees the question once the facts are attached." },
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
  node.classList.add('qi-lc');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    '      <button type="button" class="qi-chip qi-lc__prev">Previous</button>',
    '      <button type="button" class="qi-chip qi-lc__next">Next</button>',
    '    </div>',
    '  </div>',
    '  <div class="qi-lc__stage"></div>',
    '  <p class="qi-status qi-status--3 qi-lc__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const stage = node.querySelector('.qi-lc__stage');
  const statusEl = node.querySelector('.qi-lc__status');
  const prevBtn = node.querySelector('.qi-lc__prev');
  const nextBtn = node.querySelector('.qi-lc__next');

  let flow = 'answer';
  let step = null; // index into steps, or null for the overview
  let narrow = null;

  function drawWide() {
    const f = FLOWS[flow];
    const H = TOP + f.steps.length * ROW_H + 20;
    const svg = el('svg', {
      class: 'qi-svg qi-lc__svg',
      viewBox: `0 0 ${VB_W} ${H}`,
      role: 'img',
      'aria-label': "A sequence diagram with five participants: the user, LangChain, the embedding model, the Qdrant collection, and the chat model.",
    });
    const defs = el('defs');
    ACTORS.forEach((a) => {
      defs.appendChild(
        el('marker', { id: `qi-lc-head-${a.id}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' })
          .appendChild(el('path', { class: `qi-lc__head qi-lc__c--${a.id}`, d: 'M0 0L9 5L0 10Z' })).parentNode,
      );
    });
    svg.appendChild(defs);

    ACTORS.forEach((a) => {
      svg.appendChild(el('line', { class: 'qi-lc__life', x1: a.x, y1: HEAD_H, x2: a.x, y2: H - 8 }));
      const g = el('g', { class: `qi-lc__actor qi-lc__c--${a.id}` });
      g.appendChild(el('rect', { class: 'qi-lc__pill', x: a.x - 72, y: 4, width: 144, height: HEAD_H - 8, rx: 6 }));
      g.appendChild(el('text', { class: 'qi-lc__pill-name', x: a.x, y: 25, 'text-anchor': 'middle' }, a.name));
      g.appendChild(el('text', { class: 'qi-label', x: a.x, y: 43, 'text-anchor': 'middle' }, a.sub));
      svg.appendChild(g);
    });

    f.steps.forEach((s, i) => {
      const y = TOP + i * ROW_H;
      const x1 = A[s.from].x;
      const x2 = A[s.to].x;
      const dir = x2 > x1 ? 1 : -1;
      const g = el('g', { class: `qi-lc__msg qi-lc__c--${s.from}`, 'data-step': i, tabindex: '0', role: 'button', 'aria-label': `Step ${i + 1}: ${s.label}` });
      g.appendChild(el('rect', { class: 'qi-lc__hit', x: Math.min(x1, x2) - 8, y: y - 30, width: Math.abs(x2 - x1) + 16, height: 40, fill: 'transparent' }));
      g.appendChild(el('line', { class: `qi-lc__arrow${s.ret ? ' is-return' : ''}`, x1: x1 + dir * 6, y1: y, x2: x2 - dir * 6, y2: y, 'marker-end': `url(#qi-lc-head-${s.from})` }));
      // The number sits on the same line as the label: badge, gap, text, centered as one unit.
      const unitW = 28 + s.label.length * 8.4;
      const startX = (x1 + x2) / 2 - unitW / 2;
      g.appendChild(el('circle', { class: 'qi-lc__num', cx: startX + 11, cy: y - 13, r: 11 }));
      g.appendChild(el('text', { class: 'qi-lc__num-text', x: startX + 11, y: y - 9, 'text-anchor': 'middle' }, String(i + 1)));
      g.appendChild(el('text', { class: 'qi-lc__msg-label', x: startX + 28, y: y - 8, 'text-anchor': 'start' }, s.label));
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
    ol.className = 'qi-lc__list';
    f.steps.forEach((s, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `qi-lc__step qi-lc__c--${s.from}`;
      b.dataset.step = String(i);
      b.innerHTML =
        `<span class="qi-lc__badge">${i + 1}</span>` +
        `<span class="qi-lc__path"><b>${A[s.from].name}</b> to <b>${A[s.to].name}</b></span>` +
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
