const MODES = [
  { chip: 'documents: stella', status: 'stella runs a transformer on every document, so it is paid once, offline, at indexing time.' },
  { chip: 'queries: constella-zero', status: 'constella-zero only reads table rows, so embedding a query stays cheap at search time.' },
];
export function buildSvg(sel, arrowId) {
  const tokens = (y0) => [0, 1, 2].map((k) => `<rect class="c${k + 1}" x="30" y="${y0 + k * 30}" width="22" height="22" rx="4"/>`).join('');
  const vec = (x, y) => Array.from({ length: 6 }, (_, k) => `<rect class="muted" x="${x + k * 22}" y="${y}" width="20" height="26" rx="3"/>`).join('');

  // Lane 1: a network. Every node connects to every node in the next column.
  const cols = [190, 250, 310, 370];
  const ys = [94, 122, 150, 178];
  let mesh = '';
  for (let c = 0; c < cols.length - 1; c++) for (const a of ys) for (const b of ys) mesh += `M${cols[c]} ${a}L${cols[c + 1]} ${b}`;
  const nodes = cols.map((x) => ys.map((y) => `<circle class="se-node" cx="${x}" cy="${y}" r="7"/>`).join('')).join('');
  const ins = [0, 1, 2].map((k) => `<path class="se-curve c${k + 1}" d="M54 ${103 + k * 30}C120 ${103 + k * 30} 130 136 183 ${ys[k + 0] + (k === 2 ? 14 : 0)}" marker-end="url(#${arrowId})"/>`).join('');
  const lane1 = `<g class="${sel === 0 ? '' : 'dim'}">
      <text class="qi-title" x="20" y="70">stella_en_400M_v5 · documents</text>
      ${tokens(92)}${ins}
      <path class="se-mesh" d="${mesh}"/>${nodes}
      <path class="se-flow" d="M380 136C430 136 450 136 508 136" marker-end="url(#${arrowId})"/>
      ${vec(520, 123)}
      <text class="qi-label" x="190" y="214">a neural network runs on every text</text></g>`;

  // Lane 2: a table. Each token reads one row, then rows are averaged.
  const rowY = (r) => 262 + r * 17;
  const hit = { 1: 1, 3: 2, 4: 3 };
  const rows = Array.from({ length: 7 }, (_, r) => `<rect class="${hit[r] ? `c${hit[r]}` : 'se-rowbar'}" x="190" y="${rowY(r)}" width="140" height="13" rx="3"/>`).join('');
  const reads = [1, 3, 4].map((r, k) => `<path class="se-curve c${k + 1}" d="M54 ${273 + k * 30}C110 ${273 + k * 30} 130 ${rowY(r) + 6} 183 ${rowY(r) + 6}" marker-end="url(#${arrowId})"/>`).join('');
  const pools = [1, 3, 4].map((r, k) => `<path class="se-curve c${k + 1}" d="M330 ${rowY(r) + 6}C400 ${rowY(r) + 6} 420 300 468 300"/>`).join('');
  const lane2 = `<g class="${sel === 1 ? '' : 'dim'}">
      <text class="qi-title" x="20" y="242">constella-zero · queries</text>
      ${tokens(262)}${reads}${rows}${pools}
      <text class="qi-label" x="410" y="278">average</text>
      <path class="se-flow" d="M470 300H508" marker-end="url(#${arrowId})"/>
      ${vec(520, 287)}
      <text class="qi-label" x="190" y="392">each token reads one row: no network to run</text></g>`;

  return `<svg class="qi-svg" viewBox="0 0 760 430" role="img" aria-label="${MODES[sel].status} Schematic: stella passes the tokens of every text through a neural network to produce a vector. constella-zero reads one row per token from a lookup table and averages the rows into a vector.">
    ${defs(arrowId)}
    ${MODES.map((m, i) => chip(i, m.chip, 20 + i * 210, 14, i === 0 ? 190 : 230, sel)).join('')}
    ${lane1}${lane2}
    <text class="qi-label qi-label--strong" x="20" y="424">${MODES[sel].status}</text>
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
