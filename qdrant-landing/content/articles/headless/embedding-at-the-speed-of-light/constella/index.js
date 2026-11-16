export function buildSvg(sel, arrowId) {
  const vec = (x, y) => Array.from({ length: 6 }, (_, k) => `<rect class="muted" x="${x + k * 22}" y="${y}" width="20" height="26" rx="3"/>`).join('');
  const box = (x, y, w, h, text) => `<g class="se-box"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><text x="${x + 12}" y="${y + h / 2 + 5}">${text}</text></g>`;
  const arrow = (d) => `<path class="se-flow" d="${d}" marker-end="url(#${arrowId})"/>`;

  // stella: a mesh of connected nodes, to suggest a neural network.
  const cols = [165, 210, 255], ys = [74, 100, 126];
  let mesh = '';
  for (let c = 0; c < 2; c++) for (const a of ys) for (const b of ys) mesh += `M${cols[c]} ${a}L${cols[c + 1]} ${b}`;
  const nodes = cols.map((x) => ys.map((y) => `<circle class="se-node" cx="${x}" cy="${y}" r="6"/>`).join('')).join('');
  // constella-zero: a table with a few rows picked.
  const hit = { 1: 'c1', 3: 'c2' };
  const rows = Array.from({ length: 5 }, (_, r) => `<rect class="${hit[r] ?? 'se-rowbar'}" x="165" y="${222 + r * 16}" width="90" height="12" rx="3"/>`).join('');

  return `<svg class="qi-svg" viewBox="0 0 760 340" role="img" aria-label="Documents go through stella_en_400M_v5, a neural network, into document vectors stored in Qdrant. Queries go through constella-zero, a lookup table, into query vectors that Qdrant searches with.">
    ${defs(arrowId)}
    <text class="qi-title" x="20" y="38">indexing: stella_en_400M_v5</text>
    ${box(20, 82, 100, 36, 'documents')}${arrow('M120 100H150')}
    <path class="se-mesh" d="${mesh}"/>${nodes}
    ${arrow('M270 100H318')}
    ${vec(325, 87)}${arrow('M470 100C540 100 560 140 604 150')}
    <text class="qi-label" x="165" y="160">transformer, run once per document</text>

    <text class="qi-title" x="20" y="198">querying: constella-zero</text>
    ${box(20, 232, 100, 36, 'query')}${arrow('M120 250H150')}
    ${rows}
    ${arrow('M270 250H318')}
    ${vec(325, 237)}${arrow('M470 250C540 250 560 210 604 200')}
    <text class="qi-label" x="165" y="318">lookup table, no neural network</text>

    <g class="se-box"><rect x="610" y="130" width="130" height="90" rx="8"/><text x="626" y="164">Qdrant</text><text class="qi-label" x="626" y="186">vectors</text><text class="qi-label" x="626" y="204">+ search</text></g>
  </svg>`;
}

let instanceId = 0;
const defs = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="se-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>`;

export function mount(node) {
  node.classList.add('se-fig');
  node.innerHTML = `<div class="qi-fig">${buildSvg(0, `se-arrow-${++instanceId}`)}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
