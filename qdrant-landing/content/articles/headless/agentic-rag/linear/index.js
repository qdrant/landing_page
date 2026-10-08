/*
 * linear island: interactive replacement for linear-rag.png.
 *
 * A standard RAG pipeline is a fixed path: query, embed, retrieve, build the prompt,
 * generate. Step through it. Nothing can repeat or be skipped.
 */

const NS = 'http://www.w3.org/2000/svg';
const NODES = [
  { id: 'user', label: 'User', stage: 1, kind: 'msg' },
  { id: 'query', label: 'Query', stage: 1, kind: 'msg' },
  { id: 'model', label: 'Embedding model', stage: 2, kind: 'llm' },
  { id: 'embedding', label: 'Query embedding', stage: 2, kind: 'embed' },
  { id: 'db', label: 'Vector database', stage: 3, kind: 'db' },
  { id: 'candidates', label: 'Candidates', stage: 3, kind: 'plain' },
  { id: 'prompt', label: 'Prompt with context', stage: 4, kind: 'msg' },
  { id: 'llm', label: 'LLM', stage: 5, kind: 'llm' },
  { id: 'answer', label: 'Answer to the user', stage: 5, kind: 'msg' },
];
const EDGES = [
  ['user', 'query', 1], ['query', 'model', 2], ['model', 'embedding', 2], ['embedding', 'db', 3],
  ['db', 'candidates', 3], ['candidates', 'prompt', 4], ['query', 'prompt', 4], ['prompt', 'llm', 5], ['llm', 'answer', 5],
];
const STEPS = ['1 Query', '2 Embed', '3 Retrieve', '4 Prompt', '5 Generate'];
const STATUS = [
  'The user sends a query.',
  'An embedding model turns the query into a vector.',
  'The vector database returns the closest candidates for that vector.',
  'The query and the candidates are combined into one prompt.',
  'The LLM writes the answer. The path is fixed: no step can repeat or be skipped.',
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
  node.classList.add('ag-ln');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Pipeline step">',
    STEPS.map((s, i) => `<button type="button" class="qi-chip" data-step="${i + 1}" aria-pressed="false">${s}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 320" role="img" aria-label="A standard RAG pipeline: the user query is embedded, the vector database returns candidates, a prompt with context goes to the LLM, and the LLM answers.">',
    '    <g class="ag-ln__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ag-ln__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ag-ln__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ag-ln__status');
  const chips = [...node.querySelectorAll('[data-step]')];
  let step = 5;
  const isNarrow = watchNarrow(node, () => render());

  function positions(narrow) {
    const pos = {};
    if (!narrow) {
      ['user', 'query', 'model', 'embedding', 'db'].forEach((id, i) => (pos[id] = { x: 20 + i * 148, y: 40, w: 128, h: 52 }));
      [['candidates', 612], ['prompt', 464], ['llm', 316], ['answer', 168]].forEach(([id, x]) => (pos[id] = { x, y: 230, w: 128, h: 52 }));
      return { pos, W: 760, H: 320 };
    }
    NODES.forEach((n, i) => (pos[n.id] = { x: 50, y: 14 + i * 56, w: 200, h: 40 }));
    return { pos, W: 340, H: 14 + NODES.length * 56 };
  }

  function arrow(a, b, narrow, active, direct) {
    const A = a;
    const B = b;
    let start;
    let tip;
    if (narrow && direct) {
      const y1 = A.y + A.h / 2;
      const y2 = B.y + B.h / 2;
      g.appendChild(el('path', { class: `ag-ln__edge${active ? ' is-on' : ''}`, d: `M${A.x + A.w} ${y1} H${A.x + A.w + 40} V${y2} H${B.x + B.w + 8}` }));
      head([B.x + B.w, y2], [-1, 0], active);
      return;
    }
    if (narrow) {
      start = [A.x + A.w / 2, A.y + A.h];
      tip = [A.x + A.w / 2, B.y];
    } else if (Math.abs(A.y - B.y) < 4) {
      const right = B.x > A.x;
      start = [right ? A.x + A.w : A.x, A.y + A.h / 2];
      tip = [right ? B.x : B.x + B.w, B.y + B.h / 2];
    } else if (direct) {
      start = [A.x + A.w / 2, A.y + A.h];
      tip = [B.x + B.w / 2 - 6, B.y];
    } else {
      start = [A.x + A.w / 2, A.y + A.h];
      tip = [A.x + A.w / 2, B.y];
    }
    const len = Math.hypot(tip[0] - start[0], tip[1] - start[1]);
    const u = [(tip[0] - start[0]) / len, (tip[1] - start[1]) / len];
    g.appendChild(el('line', { class: `ag-ln__edge${active ? ' is-on' : ''}`, x1: start[0], y1: start[1], x2: tip[0] - u[0] * 8, y2: tip[1] - u[1] * 8 }));
    head(tip, u, active);
  }

  function head([x, y], [ux, uy], active) {
    const bx = x - ux * 10;
    const by = y - uy * 10;
    g.appendChild(el('polygon', { class: `ag-ln__head${active ? ' is-on' : ''}`, points: `${x},${y} ${bx - uy * 5},${by + ux * 5} ${bx + uy * 5},${by - ux * 5}` }));
  }

  function lines(label, narrow) {
    const words = label.split(' ');
    if (narrow || words.length < 2 || label.length < 10) return [label];
    const mid = label.length / 2;
    let best = 1;
    let bestGap = Infinity;
    for (let i = 1; i < words.length; i++) {
      const gap = Math.abs(words.slice(0, i).join(' ').length - mid);
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    }
    return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  }

  function render() {
    const narrow = isNarrow();
    const { pos, W, H } = positions(narrow);
    g.replaceChildren();
    EDGES.forEach(([a, b, stage]) => arrow(pos[a], pos[b], narrow, stage <= step, a === 'query' && b === 'prompt'));
    NODES.forEach((n) => {
      const p = pos[n.id];
      const state = n.stage < step ? ' is-done' : n.stage === step ? ' is-now' : ' is-off';
      g.appendChild(el('rect', { class: `ag-ln__node is-${n.kind}${state}`, x: p.x, y: p.y, width: p.w, height: p.h, rx: 8 }));
      const rows = lines(n.label, narrow);
      rows.forEach((row, i) => g.appendChild(el('text', { class: `ag-ln__label${state}`, x: p.x + p.w / 2, y: p.y + p.h / 2 + 5 + (i - (rows.length - 1) / 2) * 18, 'text-anchor': 'middle' }, row)));
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    statusEl.textContent = STATUS[step - 1];
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
