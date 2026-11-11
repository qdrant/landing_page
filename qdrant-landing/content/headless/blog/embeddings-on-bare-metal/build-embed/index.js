let instanceId = 0;

export function buildSvg(arrowId) {
  const box = (x, y, w, h, cls, lines) => `
    <rect class="be-box ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>
    ${lines.map((l, i) => `<text class="be-box-text" x="${x + 12}" y="${y + 22 + i * 18}">${l}</text>`).join('')}`;
  const arrow = (d) => `<path class="be-flow" d="${d}" marker-end="url(#${arrowId})"/>`;
  return `<svg class="qi-svg be-svg" viewBox="0 0 760 360" role="img" aria-label="Build time on a laptop: build.rs reads the safetensors model and the tokenizer vocabulary, then writes model constants and a vocabulary blob. include_bytes! embeds the weights and the blob into one firmware binary. Run time on the ESP32: the tokenizer reads the vocabulary blob, the pooling code reads rows of the embedding table, and both read from the binary in memory.">
    <defs><marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="be-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>
    <text class="qi-title" x="20" y="30">Build time · laptop, with std</text>
    ${box(20, 46, 170, 50, 'is-a', ['model.safetensors', 'weights + metadata'])}
    ${box(20, 112, 170, 50, 'is-b', ['tokenizer.json', 'vocabulary'])}
    ${box(250, 79, 190, 50, 'is-c', ['build.rs', 'reads, checks, writes'])}
    ${arrow('M190 71C220 71 220 104 242 104')}
    ${arrow('M190 137C220 137 220 104 242 104')}
    ${box(510, 46, 230, 50, 'is-d', ['model_meta.rs', 'DIM, TENSOR_START, ...'])}
    ${box(510, 112, 230, 50, 'is-d', ['vocab blob', 'count, index, entries'])}
    ${arrow('M440 104C470 104 470 71 502 71')}
    ${arrow('M440 104C470 104 470 137 502 137')}
    <text class="qi-title" x="20" y="206">Run time · ESP32, no_std</text>
    <rect class="be-flash" x="20" y="222" width="370" height="118" rx="8"/>
    <text class="be-flash-title" x="34" y="246">firmware binary, in flash</text>
    ${box(34, 258, 160, 62, 'is-a', ['weights table', 'include_bytes!'])}
    ${box(206, 258, 170, 62, 'is-d', ['vocab + constants', 'include_bytes!'])}
    ${arrow('M510 137C440 137 440 192 300 214')}
    <text class="qi-label" x="440" y="196">compiled in</text>
    ${box(480, 222, 260, 50, 'is-c', ['tokenizer', 'WordPiece over the blob'])}
    ${box(480, 290, 260, 50, 'is-c', ['pooling', 'rows of the table, in memory'])}
    ${arrow('M390 247H472')}
    ${arrow('M390 315H472')}
  </svg>`;
}

export function mount(node) {
  node.classList.add('be-build');
  node.innerHTML = `<div class="qi-fig">${buildSvg(`be-build-arrow-${++instanceId}`)}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
