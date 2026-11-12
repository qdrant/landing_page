// Illustrative token IDs: only ID 73 and the 256 dimensions come from the article text.
const TOKENS = [
  { text: 'vector', id: 73 },
  { text: 'search', id: 1204 },
  { text: 'is', id: 14 },
  { text: 'fast', id: 2891 },
];
const DIMS = 256;
const BYTES = 4;
const fmt = (n) => n.toLocaleString('en-US');

let instanceId = 0;

export function buildSvg(selected, arrowId) {
  const tok = TOKENS[selected];
  const rowY = (i) => 78 + i * 52;
  const cells = (x, y, cls, n = 6) =>
    Array.from({ length: n }, (_, k) => `<rect class="${cls}" x="${x + k * 17}" y="${y}" width="15" height="26" rx="3"/>`).join('');

  const chips = TOKENS.map((t, i) => `
    <g class="se-token is-${i + 1}${i === selected ? ' is-selected' : ''}" data-token="${i}" role="button" tabindex="0" aria-pressed="${i === selected}" aria-label="Token ${t.text}, ID ${t.id}">
      <rect x="20" y="${rowY(i)}" width="130" height="26" rx="6"/>
      <text x="32" y="${rowY(i) + 18}">${t.text} · ${fmt(t.id)}</text>
    </g>`).join('');

  const rows = TOKENS.map((t, i) => `
    <g class="se-row is-${i + 1}${i === selected ? ' is-selected' : ''}">
      ${cells(200, rowY(i), 'se-cell')}
      <text class="se-dots" x="304" y="${rowY(i) + 18}">…</text>
    </g>
    <path class="se-flow" d="M150 ${rowY(i) + 13}H192" marker-end="url(#${arrowId})"/>
    <path class="se-flow" d="M318 ${rowY(i) + 13}C360 ${rowY(i) + 13} 360 143 392 143" marker-end="url(#${arrowId})"/>`).join('');

  return `<svg class="qi-svg se-svg" viewBox="0 0 760 330" role="img" aria-label="A static embedding model tokenizes the text into IDs, reads one embedding row per ID from the weight table, averages the rows into one vector with mean pooling, then scales that vector to unit length.">
    <defs><marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="se-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>
    <text class="qi-title" x="20" y="34">1 · tokenize</text>
    <text class="qi-title" x="200" y="34">2 · look up rows</text>
    <text class="qi-title" x="400" y="34">3 · mean pool</text>
    <text class="qi-title" x="590" y="34">4 · L2 normalize</text>
    <text class="qi-label" x="20" y="58">"vector search is fast"</text>
    ${chips}
    ${rows}
    <rect class="se-pooled" x="400" y="130" width="116" height="26" rx="3"/>
    <text class="qi-label" x="400" y="176">one row, averaged</text>
    <text class="qi-label" x="400" y="194">per dimension</text>
    <path class="se-flow" d="M516 143H582" marker-end="url(#${arrowId})"/>
    <rect class="se-final" x="590" y="130" width="116" height="26" rx="3"/>
    <text class="qi-label" x="590" y="176">${DIMS} dimensions,</text>
    <text class="qi-label" x="590" y="194">unit length</text>
    <text class="qi-label qi-label--strong" x="20" y="300">row start for "${tok.text}" = ${BYTES} bytes × ${DIMS} dims × ID ${fmt(tok.id)} = ${fmt(BYTES * DIMS * tok.id)}</text>
  </svg>`;
}

export function mount(node) {
  node.classList.add('se-inference');
  const arrowId = `se-arrow-${++instanceId}`;
  let selected = 0;

  const render = () => {
    node.innerHTML = `<div class="qi-fig">${buildSvg(selected, arrowId)}</div>`;
    node.querySelectorAll('.se-token').forEach((g) => {
      const pick = () => { selected = Number(g.dataset.token); render(); node.querySelector(`.se-token[data-token="${selected}"]`)?.focus(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  };
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
