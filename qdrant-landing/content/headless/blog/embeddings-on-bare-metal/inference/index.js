// Illustrative token IDs: only ID 7555 for "hug" comes from the post.
const TOKENS = [
  { text: 'hug', id: 7555 },
  { text: '##s', id: 2015 },
  { text: 'are', id: 2024 },
  { text: 'nice', id: 3835 },
];
const fmt = (n) => n.toLocaleString('en-US');
let instanceId = 0;

export function buildSvg(selected, arrowId) {
  const tok = TOKENS[selected];
  const rowY = (i) => 78 + i * 52;
  const cells = (x, y) =>
    Array.from({ length: 6 }, (_, k) => `<rect class="be-cell" x="${x + k * 17}" y="${y}" width="15" height="26" rx="3"/>`).join('');

  const chips = TOKENS.map((t, i) => `
    <g class="be-token is-${i + 1}${i === selected ? ' is-selected' : ''}" data-token="${i}" role="button" tabindex="0" aria-pressed="${i === selected}" aria-label="Token ${t.text}, ID ${t.id}">
      <rect x="20" y="${rowY(i)}" width="130" height="26" rx="6"/>
      <text x="32" y="${rowY(i) + 18}">${t.text} · ${fmt(t.id)}</text>
    </g>`).join('');

  const rows = TOKENS.map((t, i) => `
    <g class="be-row is-${i + 1}${i === selected ? ' is-selected' : ''}">
      ${cells(200, rowY(i))}
      <text class="be-dots" x="304" y="${rowY(i) + 18}">…</text>
    </g>
    <path class="be-flow" d="M150 ${rowY(i) + 13}H192" marker-end="url(#${arrowId})"/>
    <path class="be-flow" d="M318 ${rowY(i) + 13}C360 ${rowY(i) + 13} 360 143 392 143" marker-end="url(#${arrowId})"/>`).join('');

  return `<svg class="qi-svg be-svg" viewBox="0 0 760 330" role="img" aria-label="Static embedding inference on the chip: the tokenizer turns the text into token IDs, each ID selects one row of the embedding table, the rows are averaged into one vector, and the vector is scaled to unit length.">
    <defs><marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="be-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>
    <text class="qi-title" x="20" y="34">1 · tokenize</text>
    <text class="qi-title" x="200" y="34">2 · look up rows</text>
    <text class="qi-title" x="400" y="34">3 · mean pool</text>
    <text class="qi-title" x="590" y="34">4 · L2 normalize</text>
    <text class="qi-label" x="20" y="58">"hugs are nice"</text>
    ${chips}
    ${rows}
    <rect class="be-pooled" x="400" y="130" width="116" height="26" rx="3"/>
    <text class="qi-label" x="400" y="176">average of the rows,</text>
    <text class="qi-label" x="400" y="194">per dimension</text>
    <path class="be-flow" d="M516 143H582" marker-end="url(#${arrowId})"/>
    <rect class="be-final" x="590" y="130" width="116" height="26" rx="3"/>
    <text class="qi-label" x="590" y="176">one vector,</text>
    <text class="qi-label" x="590" y="194">unit length</text>
    <text class="qi-label qi-label--strong" x="20" y="300">row start for "${tok.text}" = 4 bytes × DIM × ID ${fmt(tok.id)}</text>
  </svg>`;
}

export function mount(node) {
  node.classList.add('be-inference');
  const arrowId = `be-arrow-${++instanceId}`;
  let selected = 0;
  const render = () => {
    node.innerHTML = `<div class="qi-fig">${buildSvg(selected, arrowId)}</div>`;
    node.querySelectorAll('.be-token').forEach((g) => {
      const pick = () => { selected = Number(g.dataset.token); render(); node.querySelector(`.be-token[data-token="${selected}"]`)?.focus(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  };
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
