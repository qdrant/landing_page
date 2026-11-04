const STEPS = [
  { chip: '1 · read size', status: 'Read the first 8 bytes as an unsigned integer: the size N of the JSON header.' },
  { chip: '2 · parse header', status: "Read the next N bytes as JSON: it gives the tensor's dtype, shape, and byte range." },
  { chip: '3 · load weights', status: 'Load just that byte range as a numpy array, optionally through mmap.' },
];

export function buildSvg(sel, arrowId) {
  const seg = (i, x, w, cls, title) => `
    <rect class="se-seg ${cls}${i === sel ? '' : ' dim'}" x="${x}" y="90" width="${w}" height="44" rx="4"/>
    <text class="qi-label" x="${x}" y="156">${title}</text>`;
  return `<svg class="qi-svg" viewBox="0 0 760 250" role="img" aria-label="A safetensors file has three regions: 8 bytes that give the header size N, a JSON header of N bytes that describes dtype, shape, and byte range, and the raw weight bytes. Step ${sel + 1}: ${STEPS[sel].status}">
    ${defs(arrowId)}
    ${STEPS.map((s, i) => chip(i, s.chip, 20 + i * 170, 20, 160, sel)).join('')}
    <text class="qi-title" x="20" y="76">safetensors file, left to right</text>
    ${seg(0, 20, 110, 'c1', '8 bytes: N')}
    ${seg(1, 130, 250, 'c2', 'JSON header, N bytes')}
    ${seg(2, 380, 340, 'c3', 'weight bytes: vocab × 256 × 4 (f32)')}
    <text class="qi-label qi-label--strong" x="20" y="210">${STEPS[sel].status}</text>
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
