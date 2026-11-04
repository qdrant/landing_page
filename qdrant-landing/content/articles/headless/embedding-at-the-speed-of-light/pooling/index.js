const COUNTS = [[2, 1, 0, 0], [0, 1, 1, 0], [1, 0, 0, 1]];
const LENGTHS = COUNTS.map((r) => r.reduce((a, b) => a + b, 0));

export function buildSvg(sel, arrowId) {
  const rowY = (i) => 112 + i * 36;
  const counts = COUNTS.map((row, i) => `
    <rect class="se-cell-box${i === sel ? ' is-selected' : ''}" x="20" y="${rowY(i)}" width="168" height="30" rx="4"/>
    ${row.map((n, j) => `<text class="se-num${i === sel ? '' : ' dim'}" x="${41 + j * 42}" y="${rowY(i) + 20}">${n}</text>`).join('')}`).join('');
  const heads = [0, 1, 2, 3].map((j) => `<text class="qi-label" x="${41 + j * 42}" y="104" text-anchor="middle">t${j + 1}</text>`).join('');
  const emb = [0, 1, 2, 3].map((j) => {
    const used = COUNTS[sel][j] > 0;
    return Array.from({ length: 6 }, (_, k) => `<rect class="c${j + 1}${used ? '' : ' dim'}" x="${250 + k * 22}" y="${rowY(j) - 2 + 2}" width="20" height="30" rx="3"/>`).join('');
  }).join('');
  const res = [0, 1, 2].map((i) =>
    Array.from({ length: 6 }, (_, k) => `<rect class="muted${i === sel ? '' : ' dim'}" x="${470 + k * 22}" y="${rowY(i)}" width="20" height="30" rx="3"/>`).join('')).join('');
  return `<svg class="qi-svg" viewBox="0 0 760 310" role="img" aria-label="Pooling as one matrix product: a 3 by 4 count matrix of documents by distinct tokens multiplies a 4 by d matrix of the distinct tokens' embedding rows, giving 3 by d sums. Dividing each row by its text length gives the mean. Text ${sel + 1} has length ${LENGTHS[sel]}.">
    ${[0, 1, 2].map((i) => chip(i, `text ${i + 1}`, 20 + i * 110, 20, 100, sel)).join('')}
    <text class="qi-title" x="20" y="84">counts</text>
    ${heads}${counts}
    <text class="qi-title" x="204" y="${rowY(1) + 20}">@</text>
    <text class="qi-title" x="250" y="84">embedding rows</text>
    ${emb}
    <text class="qi-title" x="428" y="${rowY(1) + 20}">=</text>
    <text class="qi-title" x="470" y="84">sums</text>
    ${res}
    <text class="qi-label" x="620" y="${rowY(sel) + 20}">÷ ${LENGTHS[sel]} tokens</text>
    <text class="qi-label" x="20" y="268">documents × distinct tokens</text>
    <text class="qi-label" x="250" y="268">one row per distinct token</text>
    <text class="qi-label" x="470" y="268">documents × dimensions</text>
    <text class="qi-label qi-label--strong" x="20" y="294">One matrix product per batch. Counts and values are illustrative.</text>
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
