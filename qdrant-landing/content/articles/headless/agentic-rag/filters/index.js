/*
 * filters island: interactive replacement for extracting-filters.png.
 *
 * An LLM extracts structured conditions from a free-text query, so users do not have
 * to set filters by hand. Pick an example, and view the extracted fields or the Qdrant
 * filter built from them. The examples are illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';
const EXAMPLES = [
  { label: 'Clothing', query: 'mens denim jacket jeans coat outerwear size large', fields: { category: "Men's", style: ['Denim', 'Jacket', 'Coat', 'Outerwear'], size: ['Large'] } },
  { label: 'Shoes', query: 'red running shoes size 42 under 100 dollars', fields: { color: ['Red'], category: 'Shoes', size: ['42'], price: { lte: 100 } } },
  { label: 'Outdoor', query: "waterproof hiking boots women's", fields: { category: "Women's", style: ['Hiking', 'Boots'], features: ['Waterproof'] } },
];
const VIEWS = [
  { id: 'fields', label: 'Extracted fields' },
  { id: 'filter', label: 'Qdrant filter' },
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

function condition(key, value) {
  if (Array.isArray(value)) return { key, match: { any: value } };
  if (typeof value === 'object') return { key, range: value };
  return { key, match: { value } };
}

function jsonLines(obj, narrow) {
  if (narrow) return JSON.stringify(obj, null, 2).split('\n');
  const entries = obj.must || Object.entries(obj);
  const rows = obj.must ? entries.map((c) => JSON.stringify(c)) : entries.map(([k, v]) => `"${k}": ${JSON.stringify(v)}`);
  const open = obj.must ? '{ "must": [' : '{';
  const close = obj.must ? '] }' : '}';
  return [open, ...rows.map((r, i) => `  ${r}${i < rows.length - 1 ? ',' : ''}`), close];
}

export function mount(node) {
  node.classList.add('ag-fl');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Example query">',
    EXAMPLES.map((e, i) => `<button type="button" class="qi-chip" data-ex="${i}" aria-pressed="false">${e.label}</button>`).join(''),
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Output">',
    VIEWS.map((v) => `<button type="button" class="qi-chip" data-view="${v.id}" aria-pressed="false">${v.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 320" role="img" aria-label="A free-text query goes through an LLM, which returns structured fields and the filter built from them.">',
    '    <g class="ag-fl__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ag-fl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ag-fl__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ag-fl__status');
  const exChips = [...node.querySelectorAll('[data-ex]')];
  const viewChips = [...node.querySelectorAll('[data-view]')];
  let selected = 0;
  let view = 'fields';
  const isNarrow = watchNarrow(node, () => render());

  function arrow(x, y) {
    g.appendChild(el('line', { class: 'ag-fl__edge', x1: x, y1: y, x2: x, y2: y + 22 }));
    g.appendChild(el('polygon', { class: 'ag-fl__head', points: `${x},${y + 30} ${x - 5},${y + 21} ${x + 5},${y + 21}` }));
  }

  function render() {
    const narrow = isNarrow();
    const ex = EXAMPLES[selected];
    const W = narrow ? 340 : 760;
    const bw = narrow ? 300 : 720;
    const x0 = 20;
    g.replaceChildren();
    const qWords = ex.query;
    g.appendChild(el('rect', { class: 'ag-fl__box is-in', x: x0, y: 10, width: bw, height: narrow && ex.query.length > 31 ? 66 : 44, rx: 8 }));
    const cut = ex.query.lastIndexOf(' ', 31);
    const qLines = narrow && ex.query.length > 31 ? [ex.query.slice(0, cut), ex.query.slice(cut + 1)] : [qWords];
    qLines.forEach((line, i) => g.appendChild(el('text', { class: 'ag-fl__text', x: x0 + bw / 2, y: 38 + i * 20, 'text-anchor': 'middle' }, line)));
    const yIn = 10 + (qLines.length > 1 ? 66 : 44);
    arrow(W / 2, yIn + 4);
    g.appendChild(el('rect', { class: 'ag-fl__llm', x: W / 2 - 40, y: yIn + 40, width: 80, height: 36, rx: 8 }));
    g.appendChild(el('text', { class: 'ag-fl__label', x: W / 2, y: yIn + 64, 'text-anchor': 'middle' }, 'LLM'));
    arrow(W / 2, yIn + 80);
    const data = view === 'fields' ? ex.fields : { must: Object.entries(ex.fields).map(([k, v]) => condition(k, v)) };
    const lines = jsonLines(data, narrow);
    const yOut = yIn + 118;
    const h = lines.length * 19 + 24;
    g.appendChild(el('rect', { class: 'ag-fl__box is-out', x: x0, y: yOut, width: bw, height: h, rx: 8 }));
    lines.forEach((line, i) => {
      const t = el('text', { class: 'ag-fl__code', x: x0 + 16, y: yOut + 28 + i * 19 });
      t.setAttribute('xml:space', 'preserve');
      t.textContent = line;
      g.appendChild(t);
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${yOut + h + 12}`);
    statusEl.textContent = view === 'fields'
      ? 'The LLM turns the query into structured fields. Without this step, users would have to set these constraints by hand.'
      : 'Each field becomes one condition of a Qdrant filter, which narrows the vector search to the matching points.';
  }

  function update() {
    exChips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.ex) === selected)));
    viewChips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    render();
  }
  exChips.forEach((b) => b.addEventListener('click', () => { selected = Number(b.dataset.ex); update(); }));
  viewChips.forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; update(); }));

  update();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
