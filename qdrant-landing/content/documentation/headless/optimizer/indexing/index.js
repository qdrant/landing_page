/*
 * indexing island: what the indexing optimizer does, as a loop.
 *
 * A shard's segments are squares on a grid. Each segment holds its points as
 * vertical bars, the point style the other islands use. All optimizer islands
 * share one segment vocabulary: an optimized segment has no color and a plain
 * outline, an appendable segment has a dotted outline, a segment waiting for
 * an optimizer has an hourglass badge on its top-right corner, and the
 * outline of a segment being optimized blinks. An arrow shows where the
 * incoming points go.
 *
 * Once the appendable segment crosses indexing_threshold, an optimization is
 * pending: the segment gets the badge but stays appendable and keeps taking
 * points. When the optimizer picks it, it is wrapped in a proxy, which is
 * never appendable (shard/src/proxy_segment/segment_entry.rs), so its outline
 * turns solid and blinks, and a new appendable segment takes the new points.
 * The rebuilt segment has an HNSW index, which is not appendable either
 * (SegmentConfig::is_appendable in segment/src/types.rs), so it ends up as a
 * plain segment.
 *
 * The loop runs only while the island is on screen and can be paused. With
 * prefers-reduced-motion it starts paused and the chip jumps to the next step.
 * Pure SVG + CSS on the shared island design system (islands.scss); the other
 * optimizer islands use the same segment vocabulary.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 252). Segments are squares in a row of four slots.
const VB_W = 760;
const VB_H = 252;
const SEG = { size: 150, x0: 40, pitch: 175, y: 74 };
const CAP = 20; // points a segment holds when the optimizer picks it
const THRESHOLD = 18; // points at which a segment crosses indexing_threshold
const PER_ROW = 10; // points are drawn in two rows of ten
const WELL = { pad: 14, top: 44, h: 88, gap: 8 }; // point well, segment-local
const ARROW = { y1: 40, y2: SEG.y - 6 };
// Points arrive at a constant rate, whatever the optimizer is doing. Building
// an index takes BUILD_TICKS writes. The loop restarts once no index is being
// built and the last slot is one point short of indexing_threshold, so every
// rebuild runs to completion and the last segment never becomes pending. Everything runs on one
// clock, so Pause stops it all.
const WRITE_MS = 300; // one incoming point
const BUILD_TICKS = 14; // about 4.2 s to build an index
const FADE_TICKS = 3;

const slotX = (i) => SEG.x0 + i * SEG.pitch;
const BAR_SLOT = (SEG.size - 2 * WELL.pad) / PER_ROW;
const BAR_W = BAR_SLOT * 0.52;
const ROW_H = (WELL.h - WELL.gap) / (CAP / PER_ROW);
// Hourglass icon (Lucide, ISC license) in a 24-unit box, for pending segments.
const HOURGLASS =
  'M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2';

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

// The pending badge: an hourglass in a circle, centered on (cx, cy).
function badge(parent, cx, cy, cls) {
  const g = el('g', { class: cls, transform: `translate(${cx} ${cy})` }, parent);
  el('circle', { r: 9 }, g);
  el('path', { d: HOURGLASS, transform: 'translate(-6 -6) scale(0.5)' }, g);
  return g;
}

// One segment: a square with a name and two rows of point bars.
function segment(parent, i) {
  const g = el('g', { class: 'qi-oi__seg is-gone', transform: `translate(${slotX(i)} ${SEG.y})` }, parent);
  el('rect', { class: 'qi-oi__box', width: SEG.size, height: SEG.size, rx: 6 }, g);
  el('text', { class: 'qi-label qi-label--strong', x: 12, y: 24 }, g, `Segment ${i + 1}`);
  const bars = [];
  for (let b = 0; b < CAP; b++) {
    const bar = el('rect', {
      class: 'qi-oi__point',
      x: WELL.pad + (b % PER_ROW) * BAR_SLOT + (BAR_SLOT - BAR_W) / 2,
      y: WELL.top + Math.floor(b / PER_ROW) * (ROW_H + WELL.gap),
      width: BAR_W,
      height: ROW_H,
      rx: 1.5,
    }, g);
    bars.push(bar);
  }
  badge(g, SEG.size, 0, 'qi-oi__badge');
  const s = { g, bars, n: 0 };
  s.set = ({ n = s.n, appendable, pending, hot, shown = true }) => {
    s.n = n;
    bars.forEach((bar, b) => bar.classList.toggle('is-on', b < n));
    if (pending != null) g.classList.toggle('is-pending', pending);
    if (appendable != null) g.classList.toggle('is-appendable', appendable);
    if (hot != null) g.classList.toggle('is-hot', hot);
    g.classList.toggle('is-gone', !shown);
  };
  return s;
}

export function mount(node) {
  node.classList.add('qi-oi');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip" data-play></button>',
    '  </div>',
    `  <svg class="qi-svg qi-oi__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="A shard with segments drawn as squares holding points. New points fill the appendable segment until it crosses the indexing threshold. The indexing optimizer then picks it and builds an HNSW index for it, and a new appendable segment takes the new points.">',
    `    <rect class="qi-frame" x="0" y="2" width="${VB_W}" height="${VB_H - 4}" rx="6"/>`,
    '    <text class="qi-frame-label" x="14" y="26">Shard</text>',
    '    <g class="qi-oi__legend"></g>',
    '    <g class="qi-oi__segs"></g>',
    '    <g class="qi-oi__arrow">',
    `      <line x1="0" x2="0" y1="${ARROW.y1}" y2="${ARROW.y2 - 6}"/>`,
    `      <polygon points="0,${ARROW.y2} -5,${ARROW.y2 - 8} 5,${ARROW.y2 - 8}"/>`,
    `      <text class="qi-label" x="10" y="${ARROW.y1 + 12}">new points</text>`,
    '    </g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-oi__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-oi__svg');
  const segsG = svg.querySelector('.qi-oi__segs');
  const legendG = svg.querySelector('.qi-oi__legend');
  const arrowG = svg.querySelector('.qi-oi__arrow');
  const statusEl = node.querySelector('.qi-oi__status');
  const playBtn = node.querySelector('[data-play]');

  // Legend, shared wording across the optimizer islands.
  const keys = [
    ['point', 'point'],
    ['appendable', 'appendable segment'],
    ['pending', 'pending'],
    ['hot', 'optimizing'],
  ];
  const KEY_GAP = 22;
  const CHAR_W = 7.3; // 12px Geist Mono
  // The pending badge is wider than the other keys.
  const keyIn = (kind) => (kind === 'pending' ? 24 : 18);
  const keyW = ([kind, text]) => keyIn(kind) + text.length * CHAR_W;
  let lx = VB_W - 14 - keys.reduce((w, k) => w + keyW(k) + KEY_GAP, -KEY_GAP);
  keys.forEach((key) => {
    const [kind, text] = key;
    if (kind === 'point') {
      el('rect', { class: 'qi-oi__key qi-oi__key--point', x: lx + 3, y: 12, width: 6, height: 16, rx: 1.5 }, legendG);
    } else if (kind === 'pending') {
      badge(legendG, lx + 9, 20, 'qi-oi__badge qi-oi__key--pending');
    } else {
      el('rect', { class: `qi-oi__key qi-oi__key--${kind}`, x: lx, y: 14, width: 12, height: 12, rx: 2 }, legendG);
    }
    el('text', { class: 'qi-label', x: lx + keyIn(kind), y: 25 }, legendG, text);
    lx += keyW(key) + KEY_GAP;
  });

  const segs = [0, 1, 2, 3].map((i) => segment(segsG, i));
  const target = (i) => (arrowG.style.transform = `translate(${slotX(i) + SEG.size / 2}px, 0px)`);

  // A small simulation on one clock: every tick writes a point to the
  // appendable segment. A segment that fills up is picked by the optimizer and
  // gets its index BUILD_TICKS later, while the writes go on. The status line
  // changes only at the milestones (pending, picked, indexed), so it stays
  // readable.
  const say = (html) => (statusEl.innerHTML = html);
  let cur; // index of the appendable segment
  let building; // [{ i, left }] segments whose index is being built
  let fade; // ticks left in the fade before a restart, or 0

  function reset() {
    segs[0].set({ n: CAP, appendable: false, pending: false, hot: false });
    segs[1].set({ n: 6, appendable: true, pending: false, hot: false });
    segs[2].set({ n: 0, shown: false });
    segs[3].set({ n: 0, shown: false });
    cur = 1;
    building = [];
    fade = 0;
    target(cur);
    arrowG.classList.remove('is-gone');
    say('New points go to <b>Segment 2</b>, which has no index yet.');
  }

  // Advance one tick. Returns true when something worth narrating happened.
  function tick() {
    if (fade) {
      if (--fade === 0) reset();
      return fade === 0;
    }
    let milestone = false;

    building = building.filter((b) => {
      if (--b.left > 0) return true;
      segs[b.i].set({ hot: false });
      say(`<b>Segment ${b.i + 1}</b> is indexed.`);
      milestone = true;
      return false;
    });

    const s = segs[cur];
    s.set({ n: s.n + 1 });
    if (cur === segs.length - 1 && !building.length && s.n >= THRESHOLD - 1) {
      // Fade out before starting over, so the restart doesn't read as the
      // segments losing their index.
      segs.forEach((seg) => seg.set({ shown: false }));
      arrowG.classList.add('is-gone');
      fade = FADE_TICKS;
      return milestone;
    }
    if (s.n === THRESHOLD) {
      // Pending: the segment keeps taking points until the optimizer picks it.
      s.set({ pending: true });
      say(`<b>Segment ${cur + 1}</b> crossed <code>indexing_threshold</code> and is waiting to be indexed.`);
      milestone = true;
    }
    if (s.n === CAP) {
      s.set({ pending: false, hot: true, appendable: false });
      building.push({ i: cur, left: BUILD_TICKS });
      cur++;
      segs[cur].set({ n: 0, appendable: true, pending: false, hot: false });
      target(cur);
      say(`<b>Segment ${cur}</b> is being indexed. New points go to <b>Segment ${cur + 1}</b>.`);
      milestone = true;
    }
    return milestone;
  }

  let timer = 0;
  let playing = !reduced;
  let visible = false;

  function run() {
    window.clearInterval(timer);
    if (playing && visible) timer = window.setInterval(tick, WRITE_MS);
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
      for (let n = 0; n < 200 && !tick(); n++);
      return;
    }
    playing = !playing;
    node.classList.toggle('is-paused', !playing);
    renderButton();
    run();
  });

  // Run the loop only while the island is on screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      run();
    }).observe(node);
  } else {
    visible = true;
  }

  reset();
  renderButton();
  run();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
