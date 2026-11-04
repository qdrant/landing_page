const LENGTHS = [5, 3, 2];
const MODES = ['padded batch (ONNX)', 'flat array + lengths'];

export function buildSvg(sel, arrowId) {
  const cell = (x, y, cls) => `<rect class="${cls}" x="${x}" y="${y}" width="28" height="28" rx="4"/>`;
  let body;
  if (sel === 0) {
    body = LENGTHS.map((len, r) => {
      const y = 96 + r * 40;
      const cells = Array.from({ length: 5 }, (_, k) => cell(150 + k * 32, y, k < len ? `c${r + 1}` : 'pad')).join('');
      return `<text class="qi-label" x="20" y="${y + 19}">text ${r + 1}</text>${cells}`;
    }).join('') + `
      <text class="qi-label qi-label--strong" x="350" y="130">15 slots, 5 of them padding</text>
      <text class="qi-label" x="350" y="150">every text is stretched to the longest one</text>`;
  } else {
    let x = 150;
    const cells = LENGTHS.map((len, r) => Array.from({ length: len }, () => { const c = cell(x, 110, `c${r + 1}`); x += 32; return c; }).join('')).join('');
    body = `<text class="qi-label" x="20" y="129">token IDs</text>${cells}
      <text class="qi-label" x="20" y="189">lengths</text>
      <text class="qi-title" x="150" y="189">[5, 3, 2]</text>
      <text class="qi-label qi-label--strong" x="490" y="124">10 slots, no padding</text>
      <text class="qi-label" x="490" y="144">the lengths array marks the boundaries</text>`;
  }
  return `<svg class="qi-svg" viewBox="0 0 760 240" role="img" aria-label="${sel === 0 ? 'Padded batch: three texts of 5, 3, and 2 tokens fill 15 slots, 5 of which are padding.' : 'Flat array: the same three texts take 10 slots in one array, with a lengths array [5, 3, 2] marking the boundaries.'}">
    ${MODES.map((m, i) => chip(i, m, 20 + i * 230, 20, 220, sel)).join('')}
    ${body}
  </svg>`;
}

let instanceId = 0;
const chip = (i, label, x, y, w, selected) => `
    <g class="se-chip${i === selected ? ' is-selected' : ''}" data-i="${i}" role="button" tabindex="0" aria-pressed="${i === selected}" aria-label="${label}">
      <rect x="${x}" y="${y}" width="${w}" height="28" rx="6"/>
      <text x="${x + 12}" y="${y + 19}">${label}</text>
    </g>`;
const defs = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="se-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>`;

export function mount(node) {
  node.classList.add('se-fig');
  const arrowId = `se-arrow-${++instanceId}`;
  let selected = 0;
  const render = () => {
    node.innerHTML = `<div class="qi-fig">${buildSvg(selected, arrowId)}</div>`;
    node.querySelectorAll('.se-chip').forEach((g) => {
      const pick = () => { selected = Number(g.dataset.i); render(); node.querySelector(`.se-chip[data-i="${selected}"]`)?.focus(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  };
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
