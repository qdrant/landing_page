/*
 * autonomous island: interactive replacement for autonomous-agent.png.
 *
 * An autonomous agent can choose several actions, in any order, and repeat them until
 * it reaches its goal. Step through one illustrative run. Each tool shows how many
 * times the agent has called it so far.
 */

const NS = 'http://www.w3.org/2000/svg';
const TOOLS = [
  { id: 'rag', label: 'RAG', kind: 'rag' },
  { id: 'web', label: 'Web search', kind: 'web' },
  { id: 'api', label: 'External API', kind: 'api' },
  { id: 'world', label: 'World control', kind: 'world' },
];
const RUN = [
  { tool: 'rag', text: 'The agent starts by retrieving documents with RAG.' },
  { tool: 'web', text: 'The documents are not enough, so it searches the web.' },
  { tool: 'rag', text: 'It rewrites the query and retrieves again. Loops like this are what makes the agent autonomous.' },
  { tool: 'api', text: 'It calls an external API to confirm one detail.' },
  { tool: null, text: 'It has what it needs, and sends a follow-up message to the user.' },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('ag-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('ag-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

export function mount(node) {
  node.classList.add('ag-au');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step of the run">',
    RUN.map((_, i) => `<button type="button" class="qi-chip" data-step="${i + 1}" aria-pressed="false">Step ${i + 1}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 380" role="img" aria-label="An autonomous agent receives a message, calls tools in any order and any number of times, and finally sends a follow-up message to the user.">',
    '    <g class="ag-au__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ag-au__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ag-au__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ag-au__status');
  const chips = [...node.querySelectorAll('[data-step]')];
  let step = 5;
  const isNarrow = watchNarrow(node, () => render());

  function head(x, y, dir) {
    const pts = { right: `${x},${y} ${x - 9},${y - 5} ${x - 9},${y + 5}`, left: `${x},${y} ${x + 9},${y - 5} ${x + 9},${y + 5}`, down: `${x},${y} ${x - 5},${y - 9} ${x + 5},${y - 9}`, up: `${x},${y} ${x - 5},${y + 9} ${x + 5},${y + 9}` }[dir];
    return el('polygon', { class: 'ag-au__head', points: pts });
  }
  function box(x, y, w, h, cls, text, sub) {
    g.appendChild(el('rect', { class: cls, x, y, width: w, height: h, rx: 8 }));
    const words = text.split(' ');
    const wrap = !sub && words.length > 1 && text.length * 8.6 > w - 16;
    const rows = wrap ? [words.slice(0, -1).join(' '), words.slice(-1).join(' ')] : [text];
    rows.forEach((row, i) => g.appendChild(el('text', { class: 'ag-au__label', x: x + w / 2, y: y + h / 2 + (sub ? -2 : 5) + (i - (rows.length - 1) / 2) * 18, 'text-anchor': 'middle' }, row)));
    if (sub) g.appendChild(el('text', { class: 'ag-au__sub', x: x + w / 2, y: y + h / 2 + 16, 'text-anchor': 'middle' }, sub));
  }
  function path(d, on) {
    g.appendChild(el('path', { class: `ag-au__edge${on ? ' is-on' : ''}`, d }));
  }

  function render() {
    const narrow = isNarrow();
    const calls = {};
    RUN.slice(0, step).forEach((r) => {
      if (r.tool) calls[r.tool] = (calls[r.tool] || 0) + 1;
    });
    const current = RUN[step - 1].tool;
    const finished = step === RUN.length;
    g.replaceChildren();
    if (!narrow) {
      box(20, 70, 90, 44, 'ag-au__box is-msg', 'User');
      path('M114 90 H138', true);
      g.appendChild(head(148, 90, 'right'));
      box(152, 68, 150, 44, 'ag-au__box is-msg', 'Input message');
      path('M306 90 H338 V168 H352', true);
      g.appendChild(head(360, 168, 'right'));
      g.appendChild(el('rect', { class: 'ag-au__box is-agent', x: 364, y: 130, width: 170, height: 96, rx: 12 }));
      g.appendChild(el('text', { class: 'ag-au__label', x: 449, y: 158, 'text-anchor': 'middle' }, 'AI agent'));
      box(394, 172, 110, 36, 'ag-au__box is-llm', 'LLM(s)');
      g.appendChild(el('rect', { class: 'ag-au__panel', x: 574, y: 20, width: 170, height: 340, rx: 12 }));
      g.appendChild(el('text', { class: 'ag-au__sub', x: 589, y: 44 }, 'any tool, any order,'));
      g.appendChild(el('text', { class: 'ag-au__sub', x: 589, y: 60 }, 'as often as needed'));
      TOOLS.forEach((t, i) => {
        const y = 84 + i * 66;
        const on = t.id === current;
        const n = calls[t.id] || 0;
        box(590, y, 138, 50, `ag-au__box is-${t.kind}${on ? ' is-on' : n ? '' : ' is-off'}`, t.label, n ? `called ${n}x` : null);
        if (on) {
          path(`M534 176 C560 176 560 ${y + 18} 584 ${y + 18}`, true);
          g.appendChild(head(588, y + 18, 'right'));
          path(`M584 ${y + 34} C560 ${y + 34} 560 196 540 196`, true);
          g.appendChild(head(534, 196, 'left'));
        }
      });
      box(152, 252, 150, 44, `ag-au__box is-msg${finished ? ' is-on' : ' is-off'}`, 'Follow-up message');
      path('M364 200 H330 V274 H312', finished);
      g.appendChild(head(304, 274, 'left'));
      path('M152 274 H65 V122', finished);
      g.appendChild(head(65, 114, 'up'));
      svg.setAttribute('viewBox', '0 0 760 380');
    } else {
      box(100, 8, 140, 40, 'ag-au__box is-msg', 'User');
      path('M170 50 V58', true);
      g.appendChild(head(170, 68, 'down'));
      box(70, 70, 200, 40, 'ag-au__box is-msg', 'Input message');
      path('M170 112 V122', true);
      g.appendChild(head(170, 132, 'down'));
      g.appendChild(el('rect', { class: 'ag-au__box is-agent', x: 60, y: 134, width: 220, height: 80, rx: 12 }));
      g.appendChild(el('text', { class: 'ag-au__label', x: 170, y: 158, 'text-anchor': 'middle' }, 'AI agent'));
      box(105, 168, 130, 34, 'ag-au__box is-llm', 'LLM(s)');
      TOOLS.forEach((t, i) => {
        const y = 240 + i * 62;
        const on = t.id === current;
        const n = calls[t.id] || 0;
        box(30, y, 280, 50, `ag-au__box is-${t.kind}${on ? ' is-on' : n ? '' : ' is-off'}`, t.label, n ? `called ${n}x` : null);
        path(`M170 ${i === 0 ? 216 : y - 12} V${y - 2}`, on);
        if (on) g.appendChild(head(170, y, 'down'));
      });
      box(70, 490, 200, 40, `ag-au__box is-msg${finished ? ' is-on' : ' is-off'}`, 'Follow-up message');
      svg.setAttribute('viewBox', '0 0 340 540');
    }
    statusEl.textContent = `Step ${step}: ${RUN[step - 1].text}`;
  }

  function setStep(s) {
    step = s;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === step)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setStep(Number(b.dataset.step))));

  setStep(5);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
