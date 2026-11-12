/*
 * storage island: interactive replacement for dedicated_storage.png.
 *
 * Two ways to lay records out in storage, with the same total size:
 *   Fixed-size vectors:       every record takes the same space, so the start of
 *                             record n is (n - 1) x size, with no lookup.
 *   Variable-length records:  the start of record n is the sum of the lengths of
 *                             the records before it, so the engine needs an
 *                             offset table or has to walk the records.
 * Pick a record to read. The record lengths are illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';
const FIXED = [4, 4, 4, 4, 4];
const VARIABLE = [3, 6, 2, 5, 4];
const UNITS = 20;

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
  node.classList.toggle('dv-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('dv-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

export function mount(node) {
  node.classList.add('dv-st');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Record to read">',
    FIXED.map((_, i) => `<button type="button" class="qi-chip" data-rec="${i + 1}" aria-pressed="false">Record ${i + 1}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 300" role="img" aria-label="Five records stored as fixed-size cells and as variable-length cells. Selecting a record shows how its start position is found in each layout.">',
    '    <g class="dv-st__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 dv-st__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.dv-st__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.dv-st__status');
  const chips = [...node.querySelectorAll('[data-rec]')];
  let selected = 4;
  const isNarrow = watchNarrow(node, () => render());

  function panel(py, W, x0, u, title, lengths, variable) {
    g.appendChild(el('rect', { class: 'qi-frame', x: 8, y: py, width: W - 16, height: 136, rx: 8 }));
    g.appendChild(el('text', { class: 'qi-title', x: x0, y: py + 26 }, title));
    let x = x0;
    let startX = x0;
    let before = [];
    lengths.forEach((len, i) => {
      const n = i + 1;
      if (n === selected) startX = x;
      else if (n < selected) before.push(len);
      const cls = n === selected ? 'is-sel' : variable && n < selected ? 'is-prior' : '';
      g.appendChild(el('rect', { class: `dv-st__cell ${cls}`, x, y: py + 42, width: len * u - 2, height: 36, rx: 4 }));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong dv-st__num', x: x + (len * u - 2) / 2, y: py + 65, 'text-anchor': 'middle' }, String(n)));
      x += len * u;
    });
    if (selected > 1) {
      g.appendChild(el('path', { class: 'dv-st__span', d: `M${x0} ${py + 88} V${py + 96} H${startX} V${py + 88}` }));
    }
    const text = selected === 1
      ? 'start = 0'
      : variable
        ? `start = ${before.join(' + ')} = ${before.reduce((a, b) => a + b, 0)} units`
        : `start = ${selected - 1} × size`;
    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: x0, y: py + 120 }, text));
  }

  function render() {
    const narrow = isNarrow();
    const W = narrow ? 340 : 760;
    const x0 = narrow ? 20 : 40;
    const u = (W - 2 * x0) / UNITS;
    g.replaceChildren();
    panel(8, W, x0, u, 'Fixed-size vectors', FIXED, false);
    panel(156, W, x0, u, 'Variable-length records', VARIABLE, true);
    svg.setAttribute('viewBox', `0 0 ${W} 300`);
    statusEl.textContent = selected === 1
      ? 'Record 1 starts at 0 in both layouts. Pick a later record to see the difference.'
      : `Record ${selected}: with fixed-size vectors the start is ${selected - 1} × size, a single multiplication. With variable-length records it is the sum of the ${selected - 1} lengths before it, so the engine needs an offset table or has to walk the records.`;
  }

  function setRecord(n) {
    selected = n;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.rec) === selected)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setRecord(Number(b.dataset.rec))));

  setRecord(4);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
