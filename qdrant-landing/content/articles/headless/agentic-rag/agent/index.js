/*
 * agent island: interactive replacement for ai-agent.png.
 *
 * An agent is an LLM that decides which tool to call. Retrieval from a vector
 * database (RAG) is one tool among many. Pick a tool to see the agent call it and get
 * the result back.
 */

const NS = 'http://www.w3.org/2000/svg';
const TOOLS = [
  { id: 'rag', label: 'RAG', kind: 'rag', text: 'The agent retrieves documents from a vector database and gets them back as context for its next decision.' },
  { id: 'web', label: 'Web search', kind: 'web', text: 'The agent searches the web for information that is not in its own knowledge, and reads the results.' },
  { id: 'api', label: 'Some external API', kind: 'api', text: 'The agent calls an external API, for example to look up an order, and uses the response.' },
  { id: 'world', label: 'Taking control over the world', kind: 'world', text: 'A tool can be anything the agent is given access to, so what you expose to an agent is a design decision.' },
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
  node.classList.add('ag-ag');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Tool the agent calls">',
    TOOLS.map((t) => `<button type="button" class="qi-chip" data-tool="${t.id}" aria-pressed="false">${t.id === 'world' ? 'Take over the world' : t.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 380" role="img" aria-label="A user talks to an AI agent. The agent, driven by an LLM, can call tools: RAG, web search, an external API, and others.">',
    '    <g class="ag-ag__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ag-ag__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ag-ag__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ag-ag__status');
  const chips = [...node.querySelectorAll('[data-tool]')];
  let selected = 'rag';
  const isNarrow = watchNarrow(node, () => render());

  function head(x, y, dir) {
    const pts = { right: `${x},${y} ${x - 9},${y - 5} ${x - 9},${y + 5}`, left: `${x},${y} ${x + 9},${y - 5} ${x + 9},${y + 5}`, down: `${x},${y} ${x - 5},${y - 9} ${x + 5},${y - 9}`, up: `${x},${y} ${x - 5},${y + 9} ${x + 5},${y + 9}` }[dir];
    return el('polygon', { class: 'ag-ag__head', points: pts });
  }
  function box(x, y, w, h, cls, text) {
    g.appendChild(el('rect', { class: cls, x, y, width: w, height: h, rx: 8 }));
    g.appendChild(el('text', { class: 'ag-ag__label', x: x + w / 2, y: y + h / 2 + 5, 'text-anchor': 'middle' }, text));
  }
  function wrapped(x, y, w, h, cls, text) {
    g.appendChild(el('rect', { class: cls, x, y, width: w, height: h, rx: 8 }));
    const words = text.split(' ');
    const mid = Math.ceil(words.length / 2);
    const lines = text.length > 18 ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : [text];
    lines.forEach((line, i) => g.appendChild(el('text', { class: 'ag-ag__label', x: x + w / 2, y: y + h / 2 + 5 + (i - (lines.length - 1) / 2) * 18, 'text-anchor': 'middle' }, line)));
  }

  function render() {
    const narrow = isNarrow();
    g.replaceChildren();
    if (!narrow) {
      box(20, 160, 96, 48, 'ag-ag__box is-user', 'User');
      g.appendChild(el('line', { class: 'ag-ag__edge', x1: 120, y1: 176, x2: 252, y2: 176 }));
      g.appendChild(head(262, 176, 'right'));
      g.appendChild(el('line', { class: 'ag-ag__edge', x1: 258, y1: 196, x2: 126, y2: 196 }));
      g.appendChild(head(116, 196, 'left'));
      g.appendChild(el('rect', { class: 'ag-ag__box is-agent', x: 266, y: 130, width: 190, height: 110, rx: 12 }));
      g.appendChild(el('text', { class: 'ag-ag__label', x: 361, y: 160, 'text-anchor': 'middle' }, 'AI agent'));
      box(296, 178, 130, 40, 'ag-ag__box is-llm', 'LLM(s)');
      TOOLS.forEach((t, i) => {
        const y = 20 + i * 88;
        const on = t.id === selected;
        wrapped(540, y, 200, 64, `ag-ag__box is-${t.kind}${on ? ' is-on' : ''}`, t.label);
        g.appendChild(el('path', { class: `ag-ag__edge${on ? ' is-on' : ''}`, d: `M460 ${on ? 178 : 172} C500 ${on ? 178 : 172} 500 ${y + 26} 534 ${y + 26}` }));
        if (on) {
          g.appendChild(head(538, y + 26, 'right'));
          g.appendChild(el('path', { class: 'ag-ag__edge is-on', d: `M534 ${y + 42} C500 ${y + 42} 500 204 466 204` }));
          g.appendChild(head(460, 204, 'left'));
        }
      });
      svg.setAttribute('viewBox', '0 0 760 380');
    } else {
      box(100, 14, 140, 44, 'ag-ag__box is-user', 'User');
      g.appendChild(el('line', { class: 'ag-ag__edge', x1: 170, y1: 60, x2: 170, y2: 84 }));
      g.appendChild(head(170, 94, 'down'));
      g.appendChild(el('rect', { class: 'ag-ag__box is-agent', x: 60, y: 96, width: 220, height: 100, rx: 12 }));
      g.appendChild(el('text', { class: 'ag-ag__label', x: 170, y: 122, 'text-anchor': 'middle' }, 'AI agent'));
      box(100, 140, 140, 40, 'ag-ag__box is-llm', 'LLM(s)');
      const lastY = 240 + (TOOLS.length - 1) * 74;
      g.appendChild(el('path', { class: 'ag-ag__edge', d: `M60 146 H22 V${lastY + 28}` }));
      TOOLS.forEach((t, i) => {
        const y = 240 + i * 74;
        const on = t.id === selected;
        wrapped(44, y, 276, 56, `ag-ag__box is-${t.kind}${on ? ' is-on' : ''}`, t.label);
        g.appendChild(el('path', { class: `ag-ag__edge${on ? ' is-on' : ''}`, d: `M22 ${y + 28} H${on ? 34 : 40}` }));
        if (on) g.appendChild(head(44, y + 28, 'right'));
      });
      svg.setAttribute('viewBox', '0 0 340 540');
    }
    statusEl.textContent = TOOLS.find((t) => t.id === selected).text;
  }

  function setTool(id) {
    selected = id;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === selected)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));

  setTool('rag');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
