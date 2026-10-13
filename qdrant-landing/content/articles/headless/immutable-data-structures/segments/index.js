/*
 * segments island: interactive replacement for optimization.png.
 *
 * Qdrant data lives in segments owned by a register. A mutable segment takes
 * writes and is later converted into an immutable, optimized one:
 *   Before:      one segment serves reads and writes.
 *   Optimizing:  the segment becomes the "old" segment inside a proxy. An
 *                optimized segment is built from it, and a copy-on-write
 *                segment receives new writes.
 *   Update:      changing a point that lives in the old segment writes the new
 *                version to the copy-on-write segment and marks the old one
 *                as deleted. Nothing is changed in place.
 *   After:       the optimized segment replaces the old one, and the
 *                copy-on-write segment keeps the new writes.
 * Step through the four states with the chips.
 */

const NS = 'http://www.w3.org/2000/svg';
const STATES = [
  { id: 'before', label: 'Before' },
  { id: 'optimizing', label: 'Optimizing' },
  { id: 'update', label: 'Update during optimization' },
  { id: 'after', label: 'After' },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('im-sg');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Optimization stage">',
    STATES.map((s) => `<button type="button" class="qi-chip" data-state="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 340" role="img" aria-label="A register owning segments as a segment is optimized: a proxy holds the old segment, the optimized segment being built, and a copy-on-write segment for new writes.">',
    '    <g class="im-sg__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 im-sg__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.im-sg__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.im-sg__status');
  const chips = [...node.querySelectorAll('[data-state]')];
  let state = 'optimizing';
  let narrow = false;

  const NARROW_BELOW = 700;
  const isNarrow = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < NARROW_BELOW;
  };
  narrow = isNarrow();
  node.classList.toggle('im-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (isNarrow() !== narrow) {
        narrow = isNarrow();
        node.classList.toggle('im-narrow', narrow);
        render();
      }
    }).observe(node);
  }

  function box(x, y, w, h, title, sub, cls = '') {
    g.appendChild(el('rect', { class: `im-sg__box ${cls}`, x, y, width: w, height: h, rx: 6 }));
    g.appendChild(el('text', { class: 'qi-label qi-label--strong im-sg__title', x: x + w / 2, y: y + 28, 'text-anchor': 'middle' }, title));
    if (sub) g.appendChild(el('text', { class: 'qi-label', x: x + w / 2, y: y + 50, 'text-anchor': 'middle' }, sub));
  }
  function head(x, y, dir) {
    const pts = { down: `${x},${y} ${x - 5},${y - 9} ${x + 5},${y - 9}`, left: `${x},${y} ${x + 9},${y - 5} ${x + 9},${y + 5}`, up: `${x},${y} ${x - 5},${y + 9} ${x + 5},${y + 9}` }[dir];
    g.appendChild(el('polygon', { class: 'im-sg__head', points: pts }));
  }
  function owns(x1, y1, x2, y2) {
    g.appendChild(el('path', { class: 'im-sg__link', d: `M${x1} ${y1} V${(y1 + y2) / 2} H${x2} V${y2 - 8}` }));
    head(x2, y2, 'down');
  }
  function point(x, y, label, cls) {
    g.appendChild(el('rect', { class: `im-sg__pt ${cls}`, x, y, width: 62, height: 24, rx: 4 }));
    g.appendChild(el('text', { class: 'qi-label im-sg__ptl', x: x + 31, y: y + 17, 'text-anchor': 'middle' }, label));
    if (cls.includes('is-deleted')) g.appendChild(el('line', { class: 'im-sg__strike', x1: x + 4, y1: y + 12, x2: x + 58, y2: y + 12 }));
  }

  function render() {
    let H;
    g.replaceChildren();
    if (!narrow) {
      H = state === 'before' || state === 'after' ? 240 : 378;
      box(300, 10, 160, 40, 'Register', '', 'im-sg__reg');
      if (state === 'before') {
        owns(380, 50, 380, 120);
        g.appendChild(el('text', { class: 'qi-label', x: 392, y: 92 }, 'owns'));
        box(280, 120, 200, 90, 'Segment 1', 'reads and writes');
      } else if (state === 'after') {
        owns(330, 50, 250, 120);
        owns(430, 50, 510, 120);
        g.appendChild(el('text', { class: 'qi-label', x: 160, y: 92 }, 'owns'));
        g.appendChild(el('text', { class: 'qi-label', x: 548, y: 92 }, 'owns'));
        box(150, 120, 200, 90, 'Optimized segment', 'immutable, serves reads');
        box(410, 120, 200, 90, 'Copy-on-write segment', 'keeps the new writes');
      } else {
        owns(380, 50, 380, 100);
        g.appendChild(el('text', { class: 'qi-label', x: 392, y: 82 }, 'owns'));
        g.appendChild(el('rect', { class: 'im-sg__proxy', x: 24, y: 100, width: 712, height: 262, rx: 8 }));
        g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 40, y: 124 }, 'Proxy segment'));
        box(56, 144, 200, 112, 'Old segment', 'serves reads');
        box(280, 144, 200, 112, 'Optimized segment', 'built from the old one', 'is-building');
        box(504, 144, 200, 112, 'Copy-on-write segment', 'receives new writes');
        if (state === 'update') {
          point(125, 212, 'point 7', 'is-deleted');
          point(573, 212, 'point 7', 'is-new');
          g.appendChild(el('path', { class: 'im-sg__link is-accent', d: 'M156 256 V294 H604 V262' }));
          head(604, 256, 'up');
          g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 380, y: 328, 'text-anchor': 'middle' }, 'copy the new version, mark the old one deleted'));
        }
      }
    } else {
      const X = 20;
      const W = 300;
      box(90, 8, 160, 40, 'Register', '', 'im-sg__reg');
      if (state === 'before') {
        owns(170, 48, 170, 84);
        box(X, 84, W, 70, 'Segment 1', 'reads and writes');
        H = 176;
      } else if (state === 'after') {
        owns(170, 48, 170, 84);
        box(X, 84, W, 70, 'Optimized segment', 'immutable, serves reads');
        box(X, 174, W, 70, 'Copy-on-write segment', 'keeps the new writes');
        H = 266;
      } else {
        owns(170, 48, 170, 84);
        g.appendChild(el('rect', { class: 'im-sg__proxy', x: 6, y: 84, width: 328, height: 376, rx: 8 }));
        g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 20, y: 106 }, 'Proxy segment'));
        box(24, 120, 280, 100, 'Old segment', 'serves reads');
        box(24, 234, 280, 100, 'Optimized segment', 'built from the old one', 'is-building');
        box(24, 348, 280, 100, 'Copy-on-write segment', 'receives new writes');
        H = 480;
        if (state === 'update') {
          point(133, 184, 'point 7', 'is-deleted');
          point(133, 412, 'point 7', 'is-new');
          g.appendChild(el('path', { class: 'im-sg__link is-accent', d: 'M304 196 H322 V424 H312' }));
          head(304, 424, 'left');
        }
      }
    }
    svg.setAttribute('viewBox', `0 0 ${narrow ? 340 : 760} ${H}`);
    statusEl.innerHTML = {
      before: 'Before optimization, one segment under the register serves both reads and writes. Each segment owns its own vector storage, vector index, payload, and payload index.',
      optimizing: 'While a segment is being optimized, a <b>proxy</b> holds the old segment, which keeps serving reads, the optimized segment being built from it, and a <b>copy-on-write</b> segment that receives new writes.',
      update: 'Updating <b>point 7</b>, which lives in the old segment: the new version is written to the copy-on-write segment and the old copy is only <b>marked as deleted</b>. Nothing is changed in place.',
      after: 'When optimization finishes, the optimized segment replaces the old one. The copy-on-write segment keeps the new writes, and the deleted data in the old segment is vacuumed.',
    }[state];
  }

  function setState(s) {
    state = s;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === state)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setState(b.dataset.state)));

  setState('optimizing');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
