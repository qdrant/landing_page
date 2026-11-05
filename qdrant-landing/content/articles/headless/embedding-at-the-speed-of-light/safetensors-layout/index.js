const STEPS = [
  '1 · The first 8 bytes hold the size N of the JSON header.',
  "2 · The next N bytes are JSON: the tensor's dtype, shape, and byte range.",
  '3 · Load just that byte range as a numpy array, optionally through mmap.',
];

export function buildSvg() {
  const seg = (x, w, cls, n, label) => `
    <rect class="se-seg ${cls}" x="${x}" y="30" width="${w}" height="44" rx="4"/>
    <circle cx="${x + 18}" cy="52" r="11" fill="#fff"/><text class="qi-title" x="${x + 18}" y="57" text-anchor="middle" style="fill:#0b0f19">${n}</text>
    <text class="qi-label" x="${x}" y="98">${label}</text>`;
  return `<svg class="qi-svg" viewBox="0 0 760 220" role="img" aria-label="A safetensors file has three regions: 8 bytes that give the header size N, a JSON header of N bytes with dtype, shape, and byte range, and the raw weight bytes. ${STEPS.join(' ')}">
    ${seg(20, 110, 'c1', 1, '8 bytes: N')}
    ${seg(130, 250, 'c2', 2, 'JSON header, N bytes')}
    ${seg(380, 340, 'c3', 3, 'weight bytes: vocab × 256 × 4 (f32)')}
    ${STEPS.map((s, i) => `<text class="qi-label qi-label--strong" x="20" y="${146 + i * 26}">${s}</text>`).join('')}
  </svg>`;
}

let instanceId = 0;
const defs = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="se-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>`;

export function mount(node) {
  node.classList.add('se-fig');
  node.innerHTML = `<div class="qi-fig">${buildSvg(0, `se-arrow-${++instanceId}`)}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
