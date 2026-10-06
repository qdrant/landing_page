/*
 * chunks island: interactive replacement for raw-vectors.png and chunked-vectors.png.
 *
 * Product quantization cuts each vector into chunks (subvectors) and later stores
 * each chunk as one byte. Pick the chunk size to see how the vectors are cut and how
 * much smaller they get. The vectors are illustrative, with 8 values and 32 bytes each.
 */

const NS = 'http://www.w3.org/2000/svg';
const VECTORS = [
  [-0.25, -0.45, 0.98, -0.62, -0.98, -0.76, 0.08, 0.57],
  [0.16, 0.71, 0.82, 0.2, 0.79, 0.67, -0.06, 0.28],
  [-0.81, 0.45, -0.01, -0.17, 0.72, -0.12, -0.89, -0.99],
  [-0.3, -0.52, 0.4, 0.82, 0.65, 0.4, 0.9, 0.32],
];
const SIZES = [
  { k: 1, label: '1 float' },
  { k: 2, label: '2 floats' },
  { k: 4, label: '4 floats' },
  { k: 8, label: '8 floats' },
];
const DIM = 8;

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('pq-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('pq-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

export function mount(node) {
  node.classList.add('pq-ch');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Chunk size">',
    SIZES.map((s) => `<button type="button" class="qi-chip" data-k="${s.k}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 270" role="img" aria-label="Four vectors of eight values, cut into chunks. Chunks alternate between two colors.">',
    '    <g class="pq-ch__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 pq-ch__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.pq-ch__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.pq-ch__status');
  const chips = [...node.querySelectorAll('[data-k]')];
  let k = 4;
  const isNarrow = watchNarrow(node, () => render());

  function bracket(x, y1, y2, dir) {
    const d = dir === 'left' ? `M${x + 8} ${y1} H${x} V${y2} H${x + 8}` : `M${x - 8} ${y1} H${x} V${y2} H${x - 8}`;
    g.appendChild(el('path', { class: 'pq-ch__bracket', d }));
  }

  function render() {
    const narrow = isNarrow();
    g.replaceChildren();
    const chunks = DIM / k;
    let H;
    VECTORS.forEach((vec, r) => {
      const wideY = [24, 80, 136, 224][r];
      const narrowY = [14, 118, 222, 346][r];
      if (!narrow) {
        const x0 = 52;
        bracket(24, wideY, wideY + 36, 'left');
        vec.forEach((v, i) => {
          const x = x0 + i * 76 + Math.floor(i / k) * 10;
          const part = Math.floor(i / k) % 2 ? 'is-b' : 'is-a';
          g.appendChild(el('rect', { class: `pq-ch__box ${part}`, x, y: wideY, width: 64, height: 36, rx: 4 }));
          g.appendChild(el('text', { class: 'pq-ch__val', x: x + 32, y: wideY + 24, 'text-anchor': 'middle' }, v.toFixed(2)));
        });
        bracket(x0 + DIM * 76 + (chunks - 1) * 10 + 2, wideY, wideY + 36, 'right');
      } else {
        vec.forEach((v, i) => {
          const x = 20 + (i % 4) * 70;
          const y = narrowY + Math.floor(i / 4) * 42;
          const part = Math.floor(i / k) % 2 ? 'is-b' : 'is-a';
          g.appendChild(el('rect', { class: `pq-ch__box ${part}`, x, y, width: 62, height: 36, rx: 4 }));
          g.appendChild(el('text', { class: 'pq-ch__val', x: x + 31, y: y + 24, 'text-anchor': 'middle' }, v.toFixed(2)));
        });
      }
    });
    if (!narrow) {
      g.appendChild(el('text', { class: 'qi-label', x: 380, y: 208, 'text-anchor': 'middle' }, '···'));
      H = 270;
    } else {
      g.appendChild(el('text', { class: 'qi-label', x: 170, y: 336, 'text-anchor': 'middle' }, '···'));
      H = 450;
    }
    svg.setAttribute('viewBox', `0 0 ${narrow ? 340 : 760} ${H}`);
    const bytes = chunks;
    statusEl.textContent = chunks === 1
      ? `With 8 floats per chunk, a vector is a single chunk, 32 bytes. Each chunk is stored as one byte, so a vector takes 1 byte: ${32}x smaller.`
      : `With ${k} ${k === 1 ? 'float' : 'floats'} per chunk (${4 * k} bytes), each vector is cut into ${chunks} chunks. Each chunk is stored as one byte, so a vector takes ${bytes} bytes instead of 32: ${4 * k}x smaller.`;
  }

  function setK(next) {
    k = next;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.k) === k)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setK(Number(b.dataset.k))));

  setK(4);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
