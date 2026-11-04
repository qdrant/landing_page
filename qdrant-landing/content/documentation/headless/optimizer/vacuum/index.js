/*
 * vacuum island: what the vacuum optimizer does, as a loop.
 *
 * Same segment vocabulary as the other optimizer islands: segments are
 * squares and points are vertical bars inside them. A deleted point is only
 * marked as deleted, so it stays in place, gray.
 *
 * Points are deleted one at a time across four segments. Once a segment's
 * deleted fraction is above deleted_threshold (0.2, so 5 of its 20 points),
 * the vacuum optimizer picks it and rebuilds it on its own
 * (vacuum_optimizer.rs plans one segment per batch): the deleted points are
 * dropped, the remaining points close up, and the rebuilt segment gets a new
 * number. Deletes keep landing in the other segments meanwhile. Two segments
 * stay below the threshold and are left alone. The loop starts over a moment
 * after the second vacuum.
 *
 * The loop runs only while the island is on screen and can be paused. With
 * prefers-reduced-motion it starts paused and the chip jumps to the next step.
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 252). Four large segments, as in the other islands.
const VB_W = 760;
const VB_H = 252;
const SEG = { size: 150, x0: 40, pitch: 175, y: 74 };
const CAP = 20;
const PER_ROW = 10;
const WELL = { pad: 14, top: 44, h: 88, gap: 8 }; // point well, segment-local
const BAR_SLOT = (SEG.size - 2 * WELL.pad) / PER_ROW;
const BAR_W = 6.3;
const ROW_H = (WELL.h - WELL.gap) / (CAP / PER_ROW);
const DELETED_THRESHOLD = 0.2;

// One delete per tick, by segment. Segments 1 and 3 cross the threshold;
// segments 2 and 4 end at 3 deleted points and are left alone.
const TICK_MS = 400;
const DELETES = [0, 1, 0, 2, 0, 3, 0, 2, 0, 1, 3, 2, 1, 2, 3, 2];
// Which point in a segment goes next, so deletes look scattered.
const ORDER = [13, 4, 17, 8, 1, 11, 6, 19, 2, 15];
const NEW_NAMES = { 0: 'Segment 5', 2: 'Segment 6' }; // rebuilt segments

const slotX = (i) => SEG.x0 + i * SEG.pitch;
// Position of point slot p within a segment.
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

// One segment: a square with a name and 20 points. Each point keeps its
// element, so it can slide to a new slot when the segment is compacted.
function segment(parent, i) {
  const g = el('g', { class: 'qi-ov__seg is-gone', transform: `translate(${slotX(i)} ${SEG.y})` }, parent);
  el('rect', { class: 'qi-ov__box', width: SEG.size, height: SEG.size, rx: 6 }, g);
  const name = el('text', { class: 'qi-label qi-label--strong', x: 12, y: 24 }, g);
  const points = [];
  for (let p = 0; p < CAP; p++) {
    points.push(el('rect', { class: 'qi-ov__point is-on', x: 0, y: 0, width: BAR_W, height: ROW_H, rx: 1.5 }, g));
  }
  const s = { g, deleted: 0, name: `Segment ${i + 1}` };
  const place = (pt, p) => {
    const { x, y } = pointAt(p);
    pt.style.transform = `translate(${x}px, ${y}px)`;
  };
  s.reset = () => {
    s.deleted = 0;
    name.textContent = s.name;
    // Put the points back without animating them across the segment.
    g.classList.add('is-instant');
    points.forEach((pt, p) => {
      pt.classList.add('is-on');
      pt.classList.remove('is-deleted');
      place(pt, p);
    });
    g.getBoundingClientRect();
    g.classList.remove('is-instant');
    g.classList.remove('is-hot');
  };
  s.remove = (p) => {
    points[p].classList.add('is-deleted');
    s.deleted++;
  };
  // Drop the deleted points and close up the gaps.
  s.compact = () => {
    let slot = 0;
    points.forEach((pt) => {
      if (pt.classList.contains('is-deleted')) pt.classList.remove('is-on');
      else place(pt, slot++);
    });
  };
  s.rename = (text) => (name.textContent = text);
  s.set = ({ hot, shown }) => {
    if (hot != null) g.classList.toggle('is-hot', hot);
    if (shown != null) g.classList.toggle('is-gone', !shown);
  };
  return s;
}

export function mount(node) {
  node.classList.add('qi-ov');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip" data-play></button>',
    '  </div>',
    `  <svg class="qi-svg qi-ov__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="A shard with four segments drawn as squares holding points. Points are deleted over time and stay in place, marked as deleted. When more than 20% of a segment is deleted, the vacuum optimizer rebuilds it without the deleted points.">',
    `    <rect class="qi-frame" x="0" y="2" width="${VB_W}" height="${VB_H - 4}" rx="6"/>`,
    '    <text class="qi-frame-label" x="14" y="26">Shard</text>',
    '    <g class="qi-ov__legend"></g>',
    '    <g class="qi-ov__segs"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-ov__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-ov__svg');
  const segsG = svg.querySelector('.qi-ov__segs');
  const legendG = svg.querySelector('.qi-ov__legend');
  const statusEl = node.querySelector('.qi-ov__status');
  const playBtn = node.querySelector('[data-play]');

  // Legend, shared wording across the optimizer islands.
  const keys = [
    ['point', 'point'],
    ['deleted', 'deleted point'],
  ];
  const KEY_GAP = 22;
  const CHAR_W = 7.3; // 12px Geist Mono
  const keyW = ([, text]) => 18 + text.length * CHAR_W;
  let lx = VB_W - 14 - keys.reduce((w, k) => w + keyW(k) + KEY_GAP, -KEY_GAP);
  keys.forEach((key) => {
    const [kind, text] = key;
    el('rect', { class: `qi-ov__key qi-ov__key--${kind}`, x: lx + 3, y: 12, width: 6, height: 16, rx: 1.5 }, legendG);
    el('text', { class: 'qi-label', x: lx + 18, y: 25 }, legendG, text);
    lx += keyW(key) + KEY_GAP;
  });

  const segs = [0, 1, 2, 3].map((i) => segment(segsG, i));

  // A small simulation on one clock. Every tick deletes a point. A segment
  // above deleted_threshold is picked (pulsing), then compacted, then done
  // under a new number. Deletes go on meanwhile, in the other segments.
  const say = (html) => (statusEl.innerHTML = html);
  const COMPACT_AT = 4; // ticks after the pick
  const DONE_AT = COMPACT_AT + 3;
  const END_HOLD = 6;
  const FADE_TICKS = 3;

  let at; // next entry in DELETES
  let next; // per segment: how far into ORDER it is
  let vacuums; // [{ i, t }] vacuums in progress
  let done; // vacuums finished
  let endIn;
  let fade;

  function reset() {
    segs.forEach((s) => {
      s.reset();
      s.set({ shown: true });
    });
    at = 0;
    next = segs.map(() => 0);
    vacuums = [];
    done = 0;
    endIn = -1;
    fade = 0;
    say('Deleted points are only marked as deleted. They still take up space.');
  }

  function advance(v) {
    const s = segs[v.i];
    v.t++;
    if (v.t === COMPACT_AT) s.compact();
    if (v.t === DONE_AT) {
      s.set({ hot: false });
      s.rename(NEW_NAMES[v.i]);
      if (++done === Object.keys(NEW_NAMES).length) endIn = END_HOLD;
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
    vacuums = vacuums.filter((v) => {
      const going = advance(v);
      if (!going) milestone = true;
      return going;
    });

    if (at < DELETES.length) {
      const i = DELETES[at++];
      const s = segs[i];
      s.remove(ORDER[next[i]++]);
      if (s.deleted / CAP > DELETED_THRESHOLD) {
        s.set({ hot: true });
        vacuums.push({ i, t: 0 });
        say('Above <code>deleted_threshold</code>, a segment is rebuilt without its deleted points.');
        milestone = true;
      }
    }

    if (endIn > 0 && --endIn === 0) {
      segs.forEach((s) => s.set({ shown: false }));
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
