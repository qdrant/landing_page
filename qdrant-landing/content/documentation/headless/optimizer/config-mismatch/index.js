/*
 * config-mismatch island: what the config mismatch optimizer does.
 *
 * Same segment vocabulary as the other optimizer islands: segments are
 * squares, points are vertical bars, an appendable segment has a dashed
 * outline, and the outline of a segment being optimized pulses. Here the
 * background of an indexed segment shows which HNSW configuration it was
 * built with: configuration 1 or 2.
 *
 * Points arrive continuously. When the appendable segment fills up, it is
 * indexed with the collection's current configuration, and a new appendable
 * segment, created with the current configuration, takes the writes.
 *
 * "Change configuration" switches the collection between the two
 * configurations. Existing segments keep the configuration they were built
 * with; the config mismatch optimizer rebuilds the mismatched ones one at a
 * time, largest first (config_mismatch_optimizer.rs sorts by vector size and
 * plans one segment per batch). An existing appendable segment keeps the
 * configuration it was created with and isn't rebuilt: it has no HNSW index,
 * and the HNSW check skips plain segments. Only when it fills up and is
 * indexed does the new segment get the current configuration. When all slots
 * are full, the loop starts over in the current configuration.
 *
 * The writes run only while the island is on screen and can be paused. With
 * prefers-reduced-motion they start paused and the chip jumps to the next
 * step. Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 410). Eight segment slots in two rows of four.
const VB_W = 760;
const VB_H = 410;
const SEG = { size: 150, x0: 40, pitch: 175, rowPitch: 170, y: 74 };
const SLOTS = 8;
const CAP = 20; // points per segment, in two rows of ten
const PER_ROW = 10;
const WELL = { pad: 14, top: 44, h: 88, gap: 8 }; // point well, segment-local
const BAR_SLOT = (SEG.size - 2 * WELL.pad) / PER_ROW;
const BAR_W = 6.3;
const ROW_H = (WELL.h - WELL.gap) / (CAP / PER_ROW);

const TICK_MS = 300; // one incoming point
const START = [16, 20]; // indexed segments at the start, of different sizes
const START_FILL = 6; // points in the appendable segment at the start
const INDEX_TICKS = 4; // indexing a full appendable segment
const REBUILD_TICKS = 7; // rebuilding one mismatched segment
const FADE_TICKS = 3;

const slotXY = (i) => ({
  x: SEG.x0 + (i % 4) * SEG.pitch,
  y: SEG.y + Math.floor(i / 4) * SEG.rowPitch,
});
const pointAt = (p) => ({
  x: WELL.pad + (p % PER_ROW) * BAR_SLOT + (BAR_SLOT - BAR_W) / 2,
  y: WELL.top + Math.floor(p / PER_ROW) * (ROW_H + WELL.gap),
});

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

// One slot: a square with a name and up to 20 points. `config` (1 or 2) is
// the configuration the segment was created or built with, and its color.
// `indexed` is false for the appendable segment, which has no HNSW index.
function slot(parent, i) {
  const { x, y } = slotXY(i);
  const g = el('g', { class: 'qi-oc__seg is-gone', transform: `translate(${x} ${y})` }, parent);
  el('rect', { class: 'qi-oc__box', width: SEG.size, height: SEG.size, rx: 6 }, g);
  const name = el('text', { class: 'qi-label qi-label--strong', x: 12, y: 24 }, g);
  const bars = [];
  for (let p = 0; p < CAP; p++) {
    const { x: px, y: py } = pointAt(p);
    bars.push(el('rect', { class: 'qi-oc__point', x: px, y: py, width: BAR_W, height: ROW_H, rx: 1.5 }, g));
  }
  const s = { i, g, n: 0, config: 1, indexed: false };
  s.set = ({ n, config, indexed, name: text, hot, shown = true }) => {
    if (n != null) {
      s.n = n;
      bars.forEach((bar, b) => bar.classList.toggle('is-on', b < n));
    }
    if (config != null) {
      s.config = config;
      g.classList.toggle('is-config-1', config === 1);
      g.classList.toggle('is-config-2', config === 2);
    }
    if (indexed != null) {
      s.indexed = indexed;
      g.classList.toggle('is-appendable', !indexed);
    }
    if (text != null) name.textContent = text;
    if (hot != null) g.classList.toggle('is-hot', hot);
    g.classList.toggle('is-gone', !shown);
  };
  return s;
}

export function mount(node) {
  node.classList.add('qi-oc');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip" data-change>Change configuration</button>',
    '    <button type="button" class="qi-chip" data-play></button>',
    '    <button type="button" class="qi-chip" data-reset>',
    '      <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset',
    '    </button>',
    '  </div>',
    `  <svg class="qi-svg qi-oc__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="A shard with segments drawn as squares, colored by the configuration they were indexed with. After a configuration change, new segments are indexed with the new configuration, and the config mismatch optimizer rebuilds older segments one at a time, largest first.">',
    `    <rect class="qi-frame" x="0" y="2" width="${VB_W}" height="${VB_H - 4}" rx="6"/>`,
    '    <text class="qi-frame-label" x="14" y="26">Shard</text>',
    '    <g class="qi-oc__current">',
    '      <text class="qi-label" x="14" y="52">Current configuration:</text>',
    '      <rect class="qi-oc__key" x="186" y="41" width="12" height="12" rx="2"/>',
    '      <text class="qi-label qi-label--strong qi-oc__current-name" x="204" y="52"></text>',
    '    </g>',
    '    <g class="qi-oc__legend"></g>',
    '    <g class="qi-oc__segs"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-oc__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-oc__svg');
  const segsG = svg.querySelector('.qi-oc__segs');
  const legendG = svg.querySelector('.qi-oc__legend');
  const currentG = svg.querySelector('.qi-oc__current');
  const currentName = svg.querySelector('.qi-oc__current-name');
  const statusEl = node.querySelector('.qi-oc__status');
  const playBtn = node.querySelector('[data-play]');
  const resetBtn = node.querySelector('[data-reset]');
  const changeBtn = node.querySelector('[data-change]');

  // Legend, shared wording across the optimizer islands.
  const keys = [
    ['point', 'point'],
    ['config-1', 'config 1'],
    ['config-2', 'config 2'],
    ['appendable', 'appendable segment'],
  ];
  const KEY_GAP = 22;
  const CHAR_W = 7.3; // 12px Geist Mono
  const keyW = ([, text]) => 18 + text.length * CHAR_W;
  let lx = VB_W - 14 - keys.reduce((w, k) => w + keyW(k) + KEY_GAP, -KEY_GAP);
  keys.forEach((key) => {
    const [kind, text] = key;
    if (kind === 'point') {
      el('rect', { class: 'qi-oc__key qi-oc__key--point', x: lx + 3, y: 12, width: 6, height: 16, rx: 1.5 }, legendG);
    } else {
      el('rect', { class: `qi-oc__key qi-oc__key--${kind}`, x: lx, y: 14, width: 12, height: 12, rx: 2 }, legendG);
    }
    el('text', { class: 'qi-label', x: lx + 18, y: 25 }, legendG, text);
    lx += keyW(key) + KEY_GAP;
  });

  const slots = Array.from({ length: SLOTS }, (_, i) => slot(segsG, i));

  // A small simulation on one clock. Every tick writes a point to the
  // appendable segment. A full appendable segment is indexed with the current
  // configuration, and the next slot becomes the appendable segment. One
  // mismatched segment at a time is rebuilt, largest first.
  const say = (html) => (statusEl.innerHTML = html);
  const SAY = {
    idle: 'New segments are indexed with the current configuration.',
    rebuilding: 'Older segments are rebuilt one at a time, largest first.',
    done: 'All indexed segments match the configuration.',
  };

  let config; // the collection's configuration, 1 or 2
  let cur; // slot of the appendable segment, or SLOTS when the shard is full
  let indexing; // { s, t } while a full appendable segment is being indexed
  let rebuild; // { s, t } while a mismatched segment is being rebuilt
  let nextName;
  let fade;

  const showConfig = () => {
    currentG.classList.toggle('is-config-1', config === 1);
    currentG.classList.toggle('is-config-2', config === 2);
    currentName.textContent = `config ${config}`;
  };
  // Only indexed segments can mismatch: the HNSW check skips segments
  // without an HNSW index, so an appendable segment keeps the configuration
  // it was created with until it's indexed.
  const mismatched = () => slots.filter((s) => s.indexed && s.config !== config && s !== rebuild?.s);

  function reset() {
    slots.forEach((s, i) => {
      if (i < START.length) s.set({ n: START[i], config, indexed: true, name: `Segment ${i + 1}`, hot: false });
      else s.set({ n: 0, config, indexed: false, name: `Segment ${i + 1}`, hot: false, shown: false });
    });
    cur = START.length;
    slots[cur].set({ n: START_FILL });
    indexing = null;
    rebuild = null;
    nextName = SLOTS + 1;
    fade = 0;
    showConfig();
    say(SAY.idle);
  }

  // Advance one tick. Returns true when something worth stepping to happened.
  function tick() {
    if (fade) {
      if (--fade === 0) reset();
      return fade === 0;
    }
    let milestone = false;

    // Indexing a full appendable segment builds a new segment with the
    // configuration that's current when it's done.
    if (indexing && ++indexing.t === INDEX_TICKS) {
      indexing.s.set({ config, indexed: true, hot: false });
      indexing = null;
      milestone = true;
    }

    // Rebuilding a mismatched segment, then picking the next one.
    if (rebuild && ++rebuild.t === REBUILD_TICKS) {
      rebuild.s.set({ config, name: `Segment ${nextName++}`, hot: false });
      rebuild = null;
      milestone = true;
      if (!mismatched().length) say(SAY.done);
    }
    if (!rebuild) {
      const next = mismatched().sort((a, b) => b.n - a.n)[0];
      if (next) {
        rebuild = { s: next, t: 0 };
        next.set({ hot: true });
        say(SAY.rebuilding);
      }
    }

    // A write to the appendable segment.
    if (cur < SLOTS) {
      const s = slots[cur];
      s.set({ n: s.n + 1 });
      if (s.n === CAP) {
        s.set({ hot: true });
        indexing = { s, t: 0 };
        cur++;
        // A new appendable segment is created with the current configuration.
        if (cur < SLOTS) slots[cur].set({ n: 0, config, indexed: false });
      }
    } else if (!indexing && !rebuild) {
      // The shard is full and settled: fade out and start over.
      slots.forEach((s) => s.set({ shown: false }));
      fade = FADE_TICKS;
      milestone = true;
    }
    return milestone;
  }

  // Reset: back to configuration 1 and the starting segments.
  resetBtn.addEventListener('click', () => {
    config = 1;
    reset();
  });

  changeBtn.addEventListener('click', () => {
    config = config === 1 ? 2 : 1;
    showConfig();
    say(mismatched().length ? SAY.rebuilding : SAY.idle);
  });

  let timer = 0;
  let playing = !reduced;
  let visible = false;

  function run() {
    window.clearInterval(timer);
    if (playing && visible) timer = window.setInterval(tick, TICK_MS);
  }
  function renderButton() {
    if (!reduced) playBtn.setAttribute('aria-pressed', String(playing));
    playBtn.innerHTML = reduced
      ? 'Next step'
      : playing
        ? '<svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/></svg>Pause'
        : '<svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>Play';
  }

  playBtn.addEventListener('click', () => {
    if (reduced) {
      // Without motion, jump to the next milestone.
      for (let i = 0; i < 400 && !tick(); i++);
      return;
    }
    playing = !playing;
    node.classList.toggle('is-paused', !playing);
    renderButton();
    run();
  });

  // Run the writes only while the island is on screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      run();
    }).observe(node);
  } else {
    visible = true;
  }

  config = 1;
  reset();
  renderButton();
  run();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
