// Hours from summed per-batch timings in results/*_load_timings.json (32,893,221 passages).
const ROWS = [
  { model: 'potion-base-8M', emb: 2113.5, up: 30011.5, embMin: 35, upText: '8.3 h', total: '8.9 h' },
  { model: 'potion-retrieval-32M', emb: 2283.9, up: 36470.7, embMin: 38, upText: '10.1 h', total: '10.8 h' },
  { model: 'potion-multilingual-128M', emb: 2832.4, up: 30393.3, embMin: 47, upText: '8.4 h', total: '9.2 h' },
];
const VIEWS = ['hours', 'share of total'];

export function buildSvg(sel, arrowId) {
  const x0 = 250, W = 470;
  const bars = ROWS.map((r, i) => {
    const y = 96 + i * 82;
    const tot = r.emb + r.up;
    const scale = sel === 0 ? W / (12 * 3600) : W / tot;
    const we = r.emb * scale, wu = r.up * scale;
    return `<text class="qi-label" x="20" y="${y + 20}">${r.model}</text>
      <rect class="se-seg c1" x="${x0}" y="${y}" width="${we.toFixed(1)}" height="30" rx="3"/>
      <rect class="se-seg c3" x="${(x0 + we).toFixed(1)}" y="${y}" width="${wu.toFixed(1)}" height="30" rx="3"/>
      <text class="qi-label" x="${x0}" y="${y + 52}">embedding ${r.embMin} min · upload and ingestion ${r.upText} · total ${r.total}</text>`;
  }).join('');
  const axis = sel === 0 ? [0, 4, 8, 12].map((h) => `<text class="qi-label" x="${x0 + h * W / 12}" y="86" text-anchor="middle">${h} h</text>`).join('')
    : [0, 50, 100].map((p) => `<text class="qi-label" x="${x0 + p * W / 100}" y="86" text-anchor="middle">${p}%</text>`).join('');
  return `<svg class="qi-svg" viewBox="0 0 760 350" role="img" aria-label="Time to load 32.9 million MIRACL passages into Qdrant. potion-base-8M: embedding 35 minutes plus upload and ingestion 8.3 hours, 8.9 hours total. potion-retrieval-32M: 38 minutes plus 10.1 hours, 10.8 hours total. potion-multilingual-128M: 47 minutes plus 8.4 hours, 9.2 hours total. Embedding is under 9% of the total in every case.">
    ${VIEWS.map((v, i) => chip(i, v, 20 + i * 150, 14, 140, sel)).join('')}
    ${axis}
    ${bars}
    <rect class="se-seg c1" x="20" y="338" width="11" height="11" rx="2"/><text class="qi-label" x="38" y="348">embedding</text>
    <rect class="se-seg c3" x="150" y="338" width="11" height="11" rx="2"/><text class="qi-label" x="168" y="348">upload through the network and Qdrant ingestion</text>
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
