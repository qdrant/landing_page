/*
 * merge island: what the merge optimizer does, as a loop.
 *
 * Same segment vocabulary as the indexing island: segments are squares,
 * points are vertical bars inside them, and an appendable segment has a
 * dashed outline. Indexing is left out, so this diagram is about merging only.
 *
 * The shard starts with one large segment. Small segments appear one
 * at a time, drawn at half size in a 2 x 2 grid that takes up one large slot
 * (for example copy-on-write segments left over from other optimizations),
 * and new points fill them at the same rate as in the indexing island.
 * Once the shard has more segments than default_segment_number, the merge
 * optimizer packs the smallest segments, smallest first, while their total
 * stays under max_segment_size (merge_optimizer.rs), and rebuilds them as one
 * new segment. The small segments add up to indexing_threshold, so in
 * practice the merged segment gets an HNSW index (segment_optimizer.rs,
 * threshold_is_indexed) and isn't appendable; it's drawn with a solid outline
 * but without the indexed color. Writes go on while a merge runs: the next
 * small segments appear in the next slot. The merged segment forms in place,
 * in the same square as the grid of small segments: their borders fade while
 * its outline draws around the square. The loop starts over a moment after
 * the second merge.
 *
 * The loop runs only while the island is on screen and can be paused. With
 * prefers-reduced-motion it starts paused and the chip jumps to the next step.
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 252). Four slots for large segments.
const VB_W = 760;
const VB_H = 252;
const SEG = { size: 150, x0: 40, pitch: 175, y: 74 };
const SMALL = { size: 70, gap: 10 }; // two small segments plus a gap = one large
const CYCLES = 3; // groups of small segments, in slots 1 to 3
const MERGES = 2; // groups that get merged before the loop starts over
const SMALL_POINTS = [5, 5, 5, 5]; // adds up to indexing_threshold (20)
const PRESET = [0, 1]; // small segments of the first group that exist from the start
const WRITE_MS = 175; // one incoming point
const ARROW = { y1: 40, y2: SEG.y - 6 };

// Point layout per segment size. Points are the same size everywhere: a small
// segment has room for one row of five.
const BAR_W = 6.3;
const LAYOUT = {
  large: { size: SEG.size, perRow: 10, rows: 2, pad: 14, top: 44, bottom: 18, gap: 8, labelY: 24, labelX: 12 },
  small: { size: SMALL.size, perRow: 5, rows: 1, pad: 7, top: 22, bottom: 8, gap: 0, labelY: 15, labelX: 6 },
};

const slotX = (i) => SEG.x0 + i * SEG.pitch;
const home = (i) => ({ x: slotX(i), y: SEG.y });
// Top-left corner of small segment k (0 to 3) in the grid that fills slot i.
const cell = (i, k) => ({
  x: slotX(i) + (k % 2) * (SMALL.size + SMALL.gap),
  y: SEG.y + Math.floor(k / 2) * (SMALL.size + SMALL.gap),
});

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

// One segment: a square with a name and rows of point bars. Its position is
// set through CSS so segments can slide when they are merged.
function segment(parent, name, kind, at0) {
  const L = LAYOUT[kind];
  const g = el('g', { class: `qi-om__seg qi-om__seg--${kind} is-gone` }, parent);
  const box = el('rect', { class: 'qi-om__box', width: L.size, height: L.size, rx: kind === 'small' ? 4 : 6 }, g);
  // Large segments can form in place, with their outline drawn in by a dash
  // animation over a pathLength of 100. Small segments keep their own length,
  // so their appendable dashes stay the regular size.
  if (kind === 'large') box.setAttribute('pathLength', 100);
  el('text', { class: 'qi-label qi-label--strong qi-om__name', x: L.labelX, y: L.labelY }, g, name);
  const slot = (L.size - 2 * L.pad) / L.perRow;
  const rowH = (L.size - L.top - L.bottom - (L.rows - 1) * L.gap) / L.rows;
  const bars = [];
  for (let b = 0; b < L.perRow * L.rows; b++) {
    bars.push(
      el('rect', {
        class: 'qi-om__point',
        x: L.pad + (b % L.perRow) * slot + (slot - BAR_W) / 2,
        y: L.top + Math.floor(b / L.perRow) * (rowH + L.gap),
        width: BAR_W,
        height: rowH,
        rx: 1.5,
      }, g),
    );
  }
  const s = { g };
  // `forming` plays the merge-in animation: the outline draws itself around
  // the segment while the background fades in.
  s.set = ({ n, appendable, hot, forming, shown = true }) => {
    if (n != null) bars.forEach((bar, b) => bar.classList.toggle('is-on', b < n));
    if (appendable != null) g.classList.toggle('is-appendable', appendable);
    if (hot != null) g.classList.toggle('is-hot', hot);
    if (forming != null) g.classList.toggle('is-forming', forming);
    g.classList.toggle('is-gone', !shown);
  };
  g.setAttribute('transform', `translate(${at0.x} ${at0.y})`);
  s.set({ n: 0, shown: false });
  return s;
}

export function mount(node) {
  node.classList.add('qi-om');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip" data-play></button>',
    '  </div>',
    `  <svg class="qi-svg qi-om__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="A shard with one large segment. Small segments appear four at a time, and the merge optimizer rebuilds each group of four as one new large segment, until the shard holds four large segments.">',
    `    <rect class="qi-frame" x="0" y="2" width="${VB_W}" height="${VB_H - 4}" rx="6"/>`,
    '    <text class="qi-frame-label" x="14" y="26">Shard</text>',
    '    <g class="qi-om__legend"></g>',
    '    <g class="qi-om__segs"></g>',
    '    <g class="qi-om__arrow is-gone">',
    `      <line x1="0" x2="0" y1="${ARROW.y1}" y2="${ARROW.y2 - 6}"/>`,
    `      <polygon points="0,${ARROW.y2} -5,${ARROW.y2 - 8} 5,${ARROW.y2 - 8}"/>`,
    `      <text class="qi-label" x="10" y="${ARROW.y1 + 12}">new points</text>`,
    '    </g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-om__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-om__svg');
  const segsG = svg.querySelector('.qi-om__segs');
  const legendG = svg.querySelector('.qi-om__legend');
  const statusEl = node.querySelector('.qi-om__status');
  const playBtn = node.querySelector('[data-play]');
  const arrowG = svg.querySelector('.qi-om__arrow');
  // The "new points" arrow points at a slot, or is hidden.
  const arrow = (slot) => {
    if (slot != null) arrowG.style.transform = `translate(${slotX(slot) + SEG.size / 2}px, 0px)`;
    arrowG.classList.toggle('is-gone', slot == null);
  };

  // Legend, shared wording across the optimizer islands.
  const keys = [
    ['point', 'point'],
    ['appendable', 'appendable segment'],
  ];
  const KEY_GAP = 22;
  const CHAR_W = 7.3; // 12px Geist Mono
  const keyW = ([, text]) => 18 + text.length * CHAR_W;
  let lx = VB_W - 14 - keys.reduce((w, k) => w + keyW(k) + KEY_GAP, -KEY_GAP);
  keys.forEach((key) => {
    const [kind, text] = key;
    if (kind === 'point') {
      el('rect', { class: 'qi-om__key qi-om__key--point', x: lx + 3, y: 12, width: 6, height: 16, rx: 1.5 }, legendG);
    } else {
      el('rect', { class: `qi-om__key qi-om__key--${kind}`, x: lx, y: 14, width: 12, height: 12, rx: 2 }, legendG);
    }
    el('text', { class: 'qi-label', x: lx + 18, y: 25 }, legendG, text);
    lx += keyW(key) + KEY_GAP;
  });

  // Segment 1 fills slot 0. Each cycle c adds four small segments in slot
  // c + 1 and merges them into one large segment there. Segments are numbered
  // in the order they are created.
  const s1 = segment(segsG, 'Segment 1', 'large', home(0));
  let next = 2;
  const cycles = [];
  for (let c = 0; c < CYCLES; c++) {
    const slot = c + 1;
    const small = SMALL_POINTS.map((_, k) => segment(segsG, `Segment ${next++}`, 'small', cell(slot, k)));
    const merged = segment(segsG, `Segment ${next++}`, 'large', home(slot));
    cycles.push({ slot, small, merged });
  }
  const all = [s1, ...cycles.flatMap((c) => [...c.small, c.merged])];

  // A small simulation on one clock, as in the indexing island. Every tick
  // writes a point: a new small segment first appears empty, then points fill
  // it. When a group of four small segments is full, its merge starts and
  // runs alongside the writes, which move on to the next slot. A merge goes
  // through its stages at fixed ticks: picked (pulsing), formed in place (the
  // small segments fade while the merged segment's outline draws around the
  // same square), done. The loop ends a moment after the second merge.
  const say = (html) => (statusEl.innerHTML = html);
  const TOTAL = SMALL_POINTS.reduce((a, b) => a + b, 0);
  const FORM_AT = 8; // ticks after the pick
  const DONE_AT = FORM_AT + 7; // the forming animation takes about 1.2 s
  const END_HOLD = 6; // ticks to show the last merged segment before fading
  const FADE_TICKS = 4;

  let group; // group being written to, or CYCLES when writes have stopped
  let k; // small segment being written to within the group
  let n; // points in it, or -1 before it appears
  let merges; // [{ c, t }] merges in progress, t = ticks since the pick
  let endIn; // ticks until the fade, or -1
  let fade; // ticks left in the fade, or 0

  function reset() {
    all.forEach((seg) => seg.set({ n: 0, shown: false, hot: false, forming: false }));
    s1.set({ n: 20, appendable: false });
    // Segments 2 and 3 are small but not appendable, for example left over
    // from earlier optimizations: the merge optimizer picks segments by size
    // only, appendable or not (merge_optimizer.rs). New points fill the rest
    // of the group, starting at Segment 4.
    PRESET.forEach((k0) => cycles[0].small[k0].set({ n: SMALL_POINTS[k0], appendable: false }));
    group = 0;
    k = PRESET.length;
    n = -1;
    merges = [];
    endIn = -1;
    fade = 0;
    arrow(null);
    say('Small segments build up as new points arrive.');
  }

  function advanceMerge(m) {
    const { small, merged } = cycles[m.c];
    m.t++;
    if (m.t === FORM_AT) {
      // The merged segment forms in place: same square as the grid of small
      // segments, which fade out, borders and all.
      small.forEach((seg) => seg.set({ hot: false, shown: false }));
      merged.set({ n: TOTAL, appendable: false, hot: false, forming: true });
    }
    if (m.t === DONE_AT) {
      merged.set({ forming: false });
      if (m.c === MERGES - 1) endIn = END_HOLD;
      return false;
    }
    return true;
  }

  // Advance one tick. Returns true when something worth stepping to happened.
  function tick() {
    if (fade) {
      if (--fade === 0) reset();
      return fade === 0;
    }
    let milestone = false;
    merges = merges.filter((m) => {
      const going = advanceMerge(m);
      if (!going) milestone = true;
      return going;
    });

    if (group < CYCLES) {
      const { slot, small } = cycles[group];
      if (n < 0) {
        // A new small segment appears, empty.
        small[k].set({ n: 0, appendable: true, hot: false });
        arrow(slot);
        n = 0;
      } else {
        small[k].set({ n: ++n });
      }
      if (n === SMALL_POINTS[k]) {
        k++;
        n = -1; // the next small segment appears on the next tick
      }
      if (k === small.length) {
        if (group < MERGES) {
          // The group is full: the merge optimizer picks it, and writes move on.
          small.forEach((seg) => seg.set({ hot: true, appendable: false }));
          merges.push({ c: group, t: 0 });
          say('Above <code>default_segment_number</code>, the smallest segments are merged into one.');
          milestone = true;
        }
        group++;
        k = 0;
        if (group === CYCLES) arrow(null);
      }
    }

    if (endIn > 0 && --endIn === 0) {
      // Fade out before starting over.
      all.forEach((seg) => seg.set({ shown: false }));
      arrow(null);
      fade = FADE_TICKS;
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
      for (let i = 0; i < 400 && !tick(); i++);
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
