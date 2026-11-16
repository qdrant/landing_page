const LENGTHS = [5, 3, 2];

export function buildSvg() {
  const cell = (x, y, cls) => `<rect class="${cls}" x="${x}" y="${y}" width="26" height="26" rx="4"/>`;
  const padded = LENGTHS.map((len, r) => Array.from({ length: 5 }, (_, k) => cell(20 + k * 30, 64 + r * 34, k < len ? `c${r + 1}` : 'pad')).join('')).join('');
  let x = 330;
  const flat = LENGTHS.map((len, r) => Array.from({ length: len }, () => { const c = cell(x, 64, `c${r + 1}`); x += 30; return c; }).join('')).join('');
  return `<svg class="qi-svg" viewBox="0 0 760 210" role="img" aria-label="Three texts of 5, 3, and 2 tokens. Padded to the longest text they fill 15 slots, 5 of them padding. Kept in a flat array with a lengths array [5, 3, 2], they take 10 slots.">
    <text class="qi-title" x="20" y="34">padded batch (ONNX)</text>
    ${padded}
    <text class="qi-label qi-label--strong" x="20" y="182">15 slots, 5 of them padding</text>
    <text class="qi-title" x="330" y="34">flat array + lengths</text>
    ${flat}
    <text class="qi-title" x="330" y="126">lengths = [5, 3, 2]</text>
    <text class="qi-label qi-label--strong" x="330" y="182">10 slots, no padding</text>
  </svg>`;
}

let instanceId = 0;
const defs = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="se-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>`;

export function mount(node) {
  node.classList.add('se-fig');
  node.innerHTML = `<div class="qi-fig">${buildSvg(0, `se-arrow-${++instanceId}`)}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
