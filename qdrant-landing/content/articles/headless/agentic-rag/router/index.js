/*
 * router island: interactive replacement for routing-agent.png.
 *
 * A routing agent reads the message and chooses a single action. The action runs
 * once, its result goes back to the user, and the router never returns to an earlier
 * step. Pick the action the router chooses.
 */

const NS = 'http://www.w3.org/2000/svg';
const ACTIONS = [
  { id: 'rag', label: 'RAG', kind: 'rag', text: 'The router chooses RAG: it queries the vector database once, and the answer is generated from the retrieved documents.' },
  { id: 'web', label: 'Web search', kind: 'web', text: 'The router chooses a web search: it runs once, and the result is returned.' },
  { id: 'api', label: 'Some external API', kind: 'api', text: 'The router chooses an external API: it is called once, and its response is returned.' },
  { id: 'world', label: 'Taking control over the world', kind: 'world', text: 'Whatever the router chooses, it chooses once. It never comes back to the previous step, so it is a conditional decision-making system.' },
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
  node.classList.add('ag-rt');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Action the router chooses">',
    ACTIONS.map((a) => `<button type="button" class="qi-chip" data-action="${a.id}" aria-pressed="false">${a.id === 'world' ? 'Take over the world' : a.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 360" role="img" aria-label="A user message reaches a router agent, which chooses one action: RAG, web search, an external API, or another. The result is returned to the user.">',
    '    <g class="ag-rt__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ag-rt__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ag-rt__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ag-rt__status');
  const chips = [...node.querySelectorAll('[data-action]')];
  let selected = 'rag';
  const isNarrow = watchNarrow(node, () => render());

  function head(x, y, dir) {
    const pts = { right: `${x},${y} ${x - 9},${y - 5} ${x - 9},${y + 5}`, left: `${x},${y} ${x + 9},${y - 5} ${x + 9},${y + 5}`, down: `${x},${y} ${x - 5},${y - 9} ${x + 5},${y - 9}` }[dir];
    return el('polygon', { class: 'ag-rt__head', points: pts });
  }
  function box(x, y, w, h, cls, text) {
    g.appendChild(el('rect', { class: cls, x, y, width: w, height: h, rx: 8 }));
    g.appendChild(el('text', { class: 'ag-rt__label', x: x + w / 2, y: y + h / 2 + 5, 'text-anchor': 'middle' }, text));
  }
  function line(x1, y1, x2, y2, on = true) {
    g.appendChild(el('line', { class: `ag-rt__edge${on ? ' is-on' : ''}`, x1, y1, x2, y2 }));
  }

  function render() {
    const narrow = isNarrow();
    g.replaceChildren();
    if (!narrow) {
      box(20, 30, 90, 44, 'ag-rt__box is-msg', 'User');
      line(114, 52, 130, 52);
      g.appendChild(head(140, 52, 'right'));
      box(144, 30, 140, 44, 'ag-rt__box is-msg', 'Input message');
      line(288, 52, 322, 52);
      g.appendChild(head(332, 52, 'right'));
      box(336, 22, 200, 60, 'ag-rt__box is-agent', 'Router agent (LLM)');
      line(436, 86, 436, 104);
      g.appendChild(head(436, 114, 'down'));
      g.appendChild(el('rect', { class: 'ag-rt__panel', x: 336, y: 118, width: 400, height: 226, rx: 12 }));
      g.appendChild(el('text', { class: 'ag-rt__label', x: 356, y: 144 }, 'Choose a single action'));
      ACTIONS.forEach((a, i) => box(356, 156 + i * 44, 360, 36, `ag-rt__box is-${a.kind}${a.id === selected ? ' is-on' : ' is-off'}`, a.label));
      const sy = 156 + ACTIONS.findIndex((a) => a.id === selected) * 44 + 18;
      g.appendChild(el('path', { class: 'ag-rt__edge is-on', d: `M336 ${sy} H300 V282 H292` }));
      g.appendChild(head(284, 282, 'left'));
      box(144, 260, 140, 44, 'ag-rt__box is-msg', 'Output message');
      g.appendChild(el('path', { class: 'ag-rt__edge is-on', d: 'M144 282 H65 V308' }));
      g.appendChild(head(65, 316, 'down'));
      box(20, 318, 90, 40, 'ag-rt__box is-msg', 'User');
      svg.setAttribute('viewBox', '0 0 760 366');
    } else {
      box(100, 10, 140, 40, 'ag-rt__box is-msg', 'User');
      line(170, 52, 170, 66);
      g.appendChild(head(170, 76, 'down'));
      box(70, 78, 200, 40, 'ag-rt__box is-msg', 'Input message');
      line(170, 120, 170, 134);
      g.appendChild(head(170, 144, 'down'));
      box(70, 146, 200, 48, 'ag-rt__box is-agent', 'Router agent (LLM)');
      line(170, 196, 170, 210);
      g.appendChild(head(170, 220, 'down'));
      g.appendChild(el('rect', { class: 'ag-rt__panel', x: 20, y: 222, width: 300, height: 262, rx: 12 }));
      g.appendChild(el('text', { class: 'ag-rt__label', x: 36, y: 248 }, 'Choose a single action'));
      ACTIONS.forEach((a, i) => {
        const y = 262 + i * 54;
        g.appendChild(el('rect', { class: `ag-rt__box is-${a.kind}${a.id === selected ? ' is-on' : ' is-off'}`, x: 36, y, width: 268, height: 44, rx: 8 }));
        const words = a.label.split(' ');
        const lines = a.label.length > 24 ? [words.slice(0, 3).join(' '), words.slice(3).join(' ')] : [a.label];
        lines.forEach((l, k) => g.appendChild(el('text', { class: 'ag-rt__label', x: 170, y: y + 27 + (k - (lines.length - 1) / 2) * 17, 'text-anchor': 'middle' }, l)));
      });
      line(170, 486, 170, 500);
      g.appendChild(head(170, 510, 'down'));
      box(70, 512, 200, 40, 'ag-rt__box is-msg', 'Output message');
      line(170, 554, 170, 568);
      g.appendChild(head(170, 578, 'down'));
      box(100, 580, 140, 40, 'ag-rt__box is-msg', 'User');
      svg.setAttribute('viewBox', '0 0 340 636');
    }
    statusEl.textContent = ACTIONS.find((a) => a.id === selected).text;
  }

  function setAction(id) {
    selected = id;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.action === selected)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setAction(b.dataset.action)));

  setAction('rag');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
