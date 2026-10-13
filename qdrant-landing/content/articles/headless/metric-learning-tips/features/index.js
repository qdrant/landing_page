/*
 * features island: interactive replacement for the "Softmax feature embeddings"
 * figure.
 *
 * A regular embedder ends in one linear layer, so its vector is just numbers.
 * A feature groups embedder replaces it with several softmax layers whose outputs
 * are concatenated: each group is like a one-hot encoded feature, and a clear
 * peak in a group means the model is confident about that feature. Switch the
 * embedder, and for feature groups switch between a confident and an unsure
 * prediction. Logits are seeded and illustrative; the softmax is computed.
 */

const NS = 'http://www.w3.org/2000/svg';

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
  node.classList.toggle('ml-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('ml-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUPS = 3;
const PER = 8;
const rnd = mulberry32(9);
const NOISE = Array.from({ length: GROUPS * PER }, () => rnd() * 2 - 1);
const PEAK = [3, 5, 1]; // the favored element in each group
const softmax = (xs) => {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp(x - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
};
// confident: sharp logits around the peak; unsure: nearly flat logits
const groupValues = (gi, confident) => softmax(Array.from({ length: PER }, (_, i) => NOISE[gi * PER + i] * 0.6 + (i === PEAK[gi] ? (confident ? 4 : 0.5) : 0)));
const REGULAR = NOISE.map((v) => v * 0.9);

const WIDE = { VB_W: 760, VB_H: 380 };
const NARROW = { VB_W: 340, VB_H: 620 };

export function mount(node) {
  node.classList.add('ml-ft');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Embedder">',
    '      <button type="button" class="qi-chip" data-mode="regular" aria-pressed="false">Regular embedder</button>',
    '      <button type="button" class="qi-chip" data-mode="groups" aria-pressed="false">Feature groups embedder</button>',
    '    </div>',
    '    <div class="qi-group ml-ft__conf" role="group" aria-label="Prediction">',
    '      <button type="button" class="qi-chip" data-conf="1" aria-pressed="false">Confident prediction</button>',
    '      <button type="button" class="qi-chip" data-conf="0" aria-pressed="false">Unsure prediction</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 380" role="img" aria-label="An encoder followed by either one linear layer, or several linear and softmax layers concatenated into groups, and the resulting embedding vector as bars.">',
    '    <g class="ml-ft__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ml-ft__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ml-ft__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ml-ft__status');
  const modeChips = [...node.querySelectorAll('[data-mode]')];
  const confChips = [...node.querySelectorAll('[data-conf]')];
  const confGroup = node.querySelector('.ml-ft__conf');
  let mode = 'groups';
  let confident = true;
  const isNarrow = watchNarrow(node, () => render());

  const box = (x, y, w, h, text, cls) => {
    g.appendChild(el('rect', { class: `ml-ft__box ${cls}`, x, y, width: w, height: h, rx: 6 }));
    g.appendChild(el('text', { class: 'qi-label qi-label--strong ml-ft__t', x: x + w / 2, y: y + h / 2 + 5, 'text-anchor': 'middle' }, text));
  };
  // Arrow with its head aligned to the actual direction, so diagonals point the right way.
  const head = (x2, y2, ux, uy) => g.appendChild(el('polygon', { class: 'ml-ft__head', points: `${x2},${y2} ${x2 - ux * 9 - uy * 4.5},${y2 - uy * 9 + ux * 4.5} ${x2 - ux * 9 + uy * 4.5},${y2 - uy * 9 - ux * 4.5}` }));
  const arrow = (x1, y1, x2, y2) => {
    const L = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / L;
    const uy = (y2 - y1) / L;
    g.appendChild(el('line', { class: 'ml-ft__arrow', x1, y1, x2: x2 - ux * 8, y2: y2 - uy * 8 }));
    head(x2, y2, ux, uy);
  };

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    confGroup.hidden = mode !== 'groups';
    const groups = mode === 'groups';

    // Vector bars.
    const vx = narrow ? 85 : 520;
    const vy = narrow ? 336 : 30;
    const pitch = narrow ? 10 : 13;
    const maxW = narrow ? 170 : 150;
    const vals = groups ? [0, 1, 2].flatMap((gi) => groupValues(gi, confident)) : REGULAR;
    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: vx - (groups ? 10 : 10), y: vy - 8 }, 'Embedding vector'));
    vals.forEach((v, i) => {
      const gi = Math.floor(i / PER);
      const y = vy + i * pitch + (groups ? gi * 14 : 0);
      if (groups) {
        g.appendChild(el('rect', { class: `ml-ft__bar ${gi % 2 ? 'is-b' : 'is-a'}`, x: vx, y, width: Math.max(1.5, v * maxW), height: pitch - 3 }));
      } else {
        const w = (Math.abs(v) / 1.2) * (maxW / 2);
        g.appendChild(el('rect', { class: 'ml-ft__bar is-reg', x: v >= 0 ? vx + maxW / 2 : vx + maxW / 2 - w, y, width: Math.max(1.5, w), height: pitch - 3 }));
      }
    });
    if (!groups) g.appendChild(el('line', { class: 'qi-axis', x1: vx + maxW / 2, y1: vy - 2, x2: vx + maxW / 2, y2: vy + vals.length * pitch }));
    if (groups) {
      for (let gi = 0; gi < GROUPS; gi++) {
        const gv = vals.slice(gi * PER, (gi + 1) * PER);
        const top = vy + gi * (PER * pitch + 14);
        g.appendChild(el('text', { class: 'qi-label ml-ft__conflab', x: vx + maxW + 12, y: top + (PER * pitch) / 2 + 4 }, `max ${Math.max(...gv).toFixed(2)}`));
      }
    }

    // Network.
    if (!narrow) {
      box(20, 160, 90, 50, 'Encoder', 'is-enc');
      if (!groups) {
        arrow(110, 185, 200, 185);
        box(200, 160, 90, 50, 'Linear', 'is-lin');
        arrow(290, 185, 512, 185);
      } else {
        for (let k = 0; k < GROUPS; k++) {
          const y = 70 + k * 110;
          g.appendChild(el('path', { class: 'ml-ft__arrow', d: `M110 185 C 150 185 150 ${y + 25} 182 ${y + 25}` }));
          head(190, y + 25, 1, 0);
          box(190, y, 80, 50, 'Linear', 'is-lin');
          arrow(270, y + 25, 296, y + 25);
          box(296, y, 80, 50, 'Softmax', 'is-soft');
          arrow(376, y + 25, 420, 185);
        }
        box(420, 150, 80, 70, 'Concat', 'is-cat');
        arrow(500, 185, 512, 185);
      }
    } else {
      box(120, 10, 100, 40, 'Encoder', 'is-enc');
      if (!groups) {
        arrow(170, 50, 170, 90);
        box(120, 90, 100, 40, 'Linear', 'is-lin');
        arrow(170, 130, 170, vy - 28);
      } else {
        for (let k = 0; k < GROUPS; k++) {
          const x = 20 + k * 106;
          arrow(170, 50, x + 48, 90);
          box(x, 90, 96, 36, 'Linear', 'is-lin');
          arrow(x + 48, 126, x + 48, 150);
          box(x, 150, 96, 36, 'Softmax', 'is-soft');
          arrow(x + 48, 186, 170, 226);
        }
        box(110, 226, 120, 36, 'Concatenate', 'is-cat');
        arrow(170, 262, 170, vy - 28);
      }
    }

    statusEl.innerHTML = groups
      ? confident
        ? 'With <b>feature groups</b>, each softmax block is like a one-hot feature. A <b>clear peak</b> in a group (the "max" labels) means the model is confident about that feature, the same reading as a classifier with a softmax.'
        : 'The same groups on an <b>unsure prediction</b>: the values in each group are close to each other and no peak stands out (low "max" values), so the model is not confident about those features.'
      : 'A <b>regular embedder</b> ends in a linear layer, so the vector is just numbers. A small similarity score could mean the model is unsure or that the reference set has no match, and there is no direct way to tell.';
  }

  function sync() {
    modeChips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    confChips.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.conf === '1') === confident)));
    render();
  }
  modeChips.forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    sync();
  }));
  confChips.forEach((b) => b.addEventListener('click', () => {
    confident = b.dataset.conf === '1';
    sync();
  }));

  sync();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
