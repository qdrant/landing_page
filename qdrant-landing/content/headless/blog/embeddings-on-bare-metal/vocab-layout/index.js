// Illustrative: only "hug" with ID 7555 comes from the post. Entries are in sorted byte order.
const ENTRIES = [
  { text: '##s', id: 2015 },
  { text: 'are', id: 2024 },
  { text: 'hug', id: 7555 },
  { text: 'nice', id: 3835 },
];
const fmt = (n) => n.toLocaleString('en-US');
const entryX = [20, 200, 380, 560];
let instanceId = 0;

export function buildSvg(selected, arrowId) {
  const e = ENTRIES[selected];
  const slots = ENTRIES.map((t, i) => `
    <g class="be-slot${i === selected ? ' is-selected' : ''}" data-slot="${i}" role="button" tabindex="0" aria-pressed="${i === selected}" aria-label="Index slot ${i}, entry ${t.text}">
      <rect x="${110 + i * 140}" y="50" width="124" height="34" rx="6"/>
      <text x="${172 + i * 140}" y="72" text-anchor="middle">slot ${i}</text>
    </g>
    <path class="be-flow${i === selected ? ' is-selected' : ''}" d="M${172 + i * 140} 84C${172 + i * 140} 140 ${entryX[i] + 85} 130 ${entryX[i] + 85} 182" marker-end="url(#${arrowId})"/>`).join('');

  const entries = ENTRIES.map((t, i) => {
    const x = entryX[i];
    const w = t.text.length * 20;
    return `<g class="be-entry${i === selected ? ' is-selected' : ''}">
      <rect class="be-seg-id" x="${x}" y="190" width="70" height="48" rx="5"/>
      <rect class="be-seg-len" x="${x + 70}" y="190" width="40" height="48" rx="5"/>
      <rect class="be-seg-bytes" x="${x + 110}" y="190" width="${w}" height="48" rx="5"/>
      <text class="be-ent-text" x="${x + 35}" y="219" text-anchor="middle">${t.id}</text>
      <text class="be-ent-text" x="${x + 90}" y="219" text-anchor="middle">${t.text.length}</text>
      <text class="be-ent-text" x="${x + 110 + w / 2}" y="219" text-anchor="middle">${t.text}</text>
    </g>`;
  }).join('');

  return `<svg class="qi-svg be-svg" viewBox="0 0 760 350" role="img" aria-label="The vocabulary blob: a count, then an index of byte offsets, one slot per token, then variable-length entries in sorted order. Each index slot points to one entry made of a four-byte ID, a one-byte length, and the token bytes. Selected: slot ${selected} points to the entry for ${e.text} with ID ${e.id}.">
    <defs><marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="be-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>
    <text class="qi-title" x="20" y="30">count + INDEX: fixed 4-byte slots</text>
    <rect class="be-count" x="20" y="50" width="70" height="34" rx="6"/>
    <text class="be-slot-text" x="55" y="72" text-anchor="middle" style="fill:#fff">N</text>
    ${slots}
    <text class="be-dots" x="680" y="72">…</text>
    ${entries}
    <text class="qi-title" x="20" y="268">ENTRIES: variable length, sorted by token bytes</text>
    <text class="qi-label" x="20" y="290"><tspan class="be-key-id">■</tspan> ID, 4 bytes<tspan class="be-key-len" dx="24">■</tspan> length, 1 byte<tspan class="be-key-bytes" dx="24">■</tspan> token bytes, UTF-8</text>
    <text class="qi-label qi-label--strong" x="20" y="320">slot ${selected} stores the offset of "${e.text}": ID ${fmt(e.id)}, ${e.text.length} bytes. Binary search compares token bytes and returns the ID.</text>
  </svg>`;
}

export function mount(node) {
  node.classList.add('be-vocab');
  const arrowId = `be-vocab-arrow-${++instanceId}`;
  let selected = 2;
  const render = () => {
    node.innerHTML = `<div class="qi-fig">${buildSvg(selected, arrowId)}</div>`;
    node.querySelectorAll('.be-slot').forEach((g) => {
      const pick = () => { selected = Number(g.dataset.slot); render(); node.querySelector(`.be-slot[data-slot="${selected}"]`)?.focus(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  };
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
