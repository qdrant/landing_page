/*
 * time-based-sharding island: interactive replacement for time-based-sharding.png.
 *
 * A collection whose points are routed to one shard per day. Points are the
 * vertical bars inside each shard, as in the other islands. Writes always land
 * in the newest ("today's") shard, which keeps gaining points until it runs out
 * of drawing room; reads target whatever the query's shard key selector names.
 *
 * Two controls:
 *   - Query scope (Today / Last 2 days / All shards) lights up the shards a
 *     query actually touches, mirroring the three query snippets in the tutorial.
 *   - Next day performs a midnight rollover: an empty shard slides in on the
 *     right and starts taking the writes, the oldest is pruned off the left,
 *     mirroring the pruning snippet.
 *
 * Slot 4 is always "today", so the write arrow never moves and the rollover
 * reads as the data sliding past a fixed window. Pure SVG + CSS on the shared
 * island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 366). Shard text sits at the top so the lower half of
// every shard is a point well that fills from the bottom. The collection frame
// is inset from the top and bottom of the canvas so the client diamonds are not
// crowded against it.
const SLOTS = 5;
const SHARD = { x0: 12, y: 114, w: 140, h: 120, pitch: 149 };
const FRAME = { x: 2, y: 80, w: 756, h: 170 };
const WELL = { pad: 12, top: SHARD.y + 62, h: 44 }; // point well, shard-local
const BUS_Y = 276; // read bus, below the collection frame
const HUB_X = 380; // read client column; also the center of slot 2
const CLIENT = { hw: 46, hh: 26 };
// Shards darken toward today, as in the static illustration.
const SHADE = [0.28, 0.44, 0.6, 0.78, 1];

const CAP = 12; // points a shard has room to draw
const FILL_MS = 900; // cadence of incoming writes

const EXIT_MS = 600; // shard slide-out, then the node is discarded
const NOTE_MS = 2600; // how long a rollover note holds before the scope line returns

const SCOPES = [
  { id: 'today', label: 'Today', slots: [4] },
  { id: 'two', label: 'Last 2 days', slots: [3, 4] },
  { id: 'all', label: 'All shards', slots: [0, 1, 2, 3, 4] },
];
// The diagram opens on the full fan-out, so every shard is wired up at a glance
// and narrowing the scope is what the reader does next.
const DEFAULT_SCOPE = 'all';

const slotX = (i) => SHARD.x0 + i * SHARD.pitch;
const slotCx = (i) => slotX(i) + SHARD.w / 2;

/* Shard keys are local calendar days, so the newest shard carries the reader's
   own today. Stepping with setDate and reading the local year/month/day keeps
   the labels right across a DST change and in every timezone; adding 24h of
   milliseconds, or formatting through toISOString, would not. */
function dayKey(offsetDays) {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // midday, so a DST shift cannot roll the date over
  d.setDate(d.getDate() + offsetDays);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const WELL_SLOT = (SHARD.w - 2 * WELL.pad) / CAP;
const BAR_W = WELL_SLOT * 0.52;

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

function diamond(cx, cy) {
  const { hw, hh } = CLIENT;
  return `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
}

/* Read connector for one shard: along the bus from the hub, then a rounded
   corner up into the shard's bottom edge. Orthogonal routing only. */
function riserPath(cx) {
  const top = SHARD.y + SHARD.h + 6;
  if (cx === HUB_X) return `M ${HUB_X} ${BUS_Y} V ${top}`;
  const dir = cx > HUB_X ? -1 : 1;
  return `M ${HUB_X} ${BUS_Y} H ${cx + dir * 12} Q ${cx} ${BUS_Y} ${cx} ${BUS_Y - 12} V ${top}`;
}

export function mount(node) {
  node.classList.add('qi-tbs');

  const writeY = 32;
  const readCy = 336;
  const todayCx = slotCx(SLOTS - 1);

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-next>',
    '        <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>Next day',
    '      </button>',
    '      <button type="button" class="qi-chip" data-reset hidden>',
    '        <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset',
    '      </button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-tbs__svg" viewBox="0 0 760 366" role="img"',
    '    aria-label="A collection holding one shard per day, each shard a column of points. New points keep arriving in today\'s shard; reads fan out to the shards named by the query\'s shard key selector.">',
    '    <defs>',
    '      <marker id="qi-tbs-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">',
    '        <path class="qi-tbs__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    // Collection frame and its daily shards.
    `    <rect class="qi-frame" x="${FRAME.x}" y="${FRAME.y}" width="${FRAME.w}" height="${FRAME.h}" rx="6"/>`,
    `    <text class="qi-frame-label" x="${FRAME.x + 16}" y="${FRAME.y + 22}">Collection</text>`,
    '    <g class="qi-tbs__shards"></g>',
    // Write path: client, elbow right, then down into today's shard. Emitted
    // after the collection so the wire crosses the frame edge on top of it;
    // SVG paints in document order and has no z-index.
    `    <polygon class="qi-tbs__client" points="${diamond(HUB_X, writeY)}"/>`,
    `    <text class="qi-tbs__client-text" x="${HUB_X}" y="${writeY + 4}">Client</text>`,
    `    <path class="qi-tbs__wire" d="M ${HUB_X + CLIENT.hw} ${writeY} H ${todayCx - 12} Q ${todayCx} ${writeY} ${todayCx} ${writeY + 12} V ${SHARD.y - 4}" marker-end="url(#qi-tbs-arrow)"/>`,
    `    <text class="qi-tbs__wire-text" x="${(HUB_X + CLIENT.hw + todayCx) / 2}" y="${writeY - 10}">Writes</text>`,
    // Read path: one riser per shard, joining a shared bus down to the client.
    '    <g class="qi-tbs__risers"></g>',
    `    <path class="qi-tbs__wire" d="M ${HUB_X} ${BUS_Y} V ${readCy - CLIENT.hh}"/>`,
    `    <text class="qi-tbs__wire-text qi-tbs__wire-text--reads" x="${HUB_X - 8}" y="${BUS_Y + 24}">Reads</text>`,
    `    <polygon class="qi-tbs__client" points="${diamond(HUB_X, readCy)}"/>`,
    `    <text class="qi-tbs__client-text" x="${HUB_X}" y="${readCy + 4}">Client</text>`,
    '  </svg>',
    // Scope sits under the diagram, next to the status line it drives.
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <span class="qi-hint">Query scope:</span>',
    SCOPES.map(
      (s) => `<button type="button" class="qi-chip" data-scope="${s.id}" aria-pressed="false">${s.label}</button>`,
    ).join(''),
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-tbs__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const shardsG = node.querySelector('.qi-tbs__shards');
  const risersG = node.querySelector('.qi-tbs__risers');
  const statusEl = node.querySelector('.qi-tbs__status');
  const nextBtn = node.querySelector('[data-next]');
  const resetBtn = node.querySelector('[data-reset]');
  const scopeBtns = [...node.querySelectorAll('[data-scope]')];

  // Risers are fixed geometry, one per slot; only their visibility changes.
  const risers = [];
  for (let i = 0; i < SLOTS; i++) {
    const p = el('path', { class: 'qi-tbs__riser', d: riserPath(slotCx(i)), 'marker-end': 'url(#qi-tbs-arrow)' });
    risers.push(p);
    risersG.appendChild(p);
  }

  // One <g> per date, pooled so a shard keeps its identity and its points
  // across a rollover.
  const pool = new Map();
  let scope = SCOPES.find((s) => s.id === DEFAULT_SCOPE);
  let offset = 0;
  let first = true;
  let noteTimer = 0;
  let fillTimer = 0;

  function windowDates(off) {
    const out = [];
    for (let i = 0; i < SLOTS; i++) out.push(dayKey(off - (SLOTS - 1) + i));
    return out;
  }

  function makeShard(date, count) {
    const g = el('g', { class: 'qi-tbs__shard' });
    const box = el('rect', { class: 'qi-tbs__box', x: 0, y: SHARD.y, width: SHARD.w, height: SHARD.h, rx: 6 });
    const title = el('text', { class: 'qi-title qi-tbs__shard-title', x: SHARD.w / 2, y: SHARD.y + 26, 'text-anchor': 'middle' });
    const label = el('text', { class: 'qi-label qi-label--strong', x: SHARD.w / 2, y: SHARD.y + 48, 'text-anchor': 'middle' });
    label.textContent = date;
    g.appendChild(box);
    g.appendChild(title);
    g.appendChild(label);

    const bars = [];
    for (let i = 0; i < CAP; i++) {
      const bar = el('rect', {
        class: 'qi-tbs__bar',
        x: WELL.pad + i * WELL_SLOT + (WELL_SLOT - BAR_W) / 2,
        y: WELL.top,
        width: BAR_W,
        height: WELL.h,
        rx: 2,
      });
      bars.push(bar);
      g.appendChild(bar);
    }
    shardsG.appendChild(g);
    const s = { g, box, title, label, bars, count };
    paintBars(s);
    return s;
  }

  function paintBars(s) {
    for (let i = 0; i < CAP; i++) s.bars[i].classList.toggle('is-on', i < s.count);
  }

  // Writes keep landing in today's shard until it runs out of room to draw
  // them. The chain stops there, so nothing ticks forever in the background.
  function scheduleFill() {
    window.clearTimeout(fillTimer);
    const today = pool.get(windowDates(offset)[SLOTS - 1]);
    if (!today || today.count >= CAP) return;
    fillTimer = window.setTimeout(() => {
      today.count++;
      paintBars(today);
      scheduleFill();
    }, FILL_MS);
  }

  function scopeStatus(dates) {
    if (scope.id === 'all') return `No shard key selector, so the query fans out to all ${SLOTS} shards.`;
    const keys = scope.slots.map((i) => `"${dates[i]}"`);
    const sel = keys.length === 1 ? keys[0] : `[${keys.join(', ')}]`;
    return `Reads target <code>shard_key=${sel}</code>: ${keys.length} of ${SLOTS} shards.`;
  }

  function render(note) {
    const dates = windowDates(offset);

    scopeBtns.forEach((b) => {
      const on = b.dataset.scope === scope.id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    resetBtn.hidden = offset === 0;

    // Shards that left the window slide off to the left, then are discarded.
    // They are dropped from the pool first, so a date that comes back (Reset)
    // always gets a fresh node rather than one that is on its way out.
    pool.forEach((s, date) => {
      if (dates.indexOf(date) !== -1) return;
      pool.delete(date);
      s.g.classList.add('is-gone');
      s.g.style.transform = `translate(${slotX(-1)}px, 0)`;
      window.setTimeout(() => s.g.remove(), EXIT_MS);
    });

    // Refresh each visible shard, staging new ones just off the right edge. A
    // shard born in the last slot is the new day and starts empty; one born
    // further left is history the reader never watched fill, so it starts full.
    let entered = 0;
    dates.forEach((date, i) => {
      let s = pool.get(date);
      if (!s) {
        s = makeShard(date, i < SLOTS - 1 ? CAP : 0);
        pool.set(date, s);
        if (!first) {
          s.g.classList.add('is-gone');
          s.g.style.transform = `translate(${slotX(SLOTS)}px, 0)`;
          entered++;
        }
      }
      s.box.style.setProperty('--shade', SHADE[i]);
      s.box.classList.toggle('is-hot', scope.slots.indexOf(i) !== -1);
      // Only the shard taking writes carries the write path's violet; sealed
      // days go neutral, so the colour tracks where new points are landing. A
      // shard keeps its points when it rolls over, so the reader can follow the
      // same day's data sliding across the window.
      s.g.classList.toggle('is-open', i === SLOTS - 1);
      const title = i === SLOTS - 1 ? "Today's shard" : i === SLOTS - 2 ? "Yesterday's shard" : '';
      s.title.textContent = title;
    });

    // Commit the from-state of entering shards before animating them into
    // place. A forced reflow is more robust than requestAnimationFrame, which
    // pauses on hidden tabs.
    if (entered) void shardsG.getBoundingClientRect();
    dates.forEach((date, i) => {
      const s = pool.get(date);
      s.g.classList.remove('is-gone');
      s.g.style.transform = `translate(${slotX(i)}px, 0)`;
    });

    risers.forEach((p, i) => p.classList.toggle('is-on', scope.slots.indexOf(i) !== -1));

    window.clearTimeout(noteTimer);
    statusEl.innerHTML = note || scopeStatus(dates);
    if (note) {
      noteTimer = window.setTimeout(() => (statusEl.innerHTML = scopeStatus(windowDates(offset))), NOTE_MS);
    }
    first = false;
    scheduleFill();
  }

  scopeBtns.forEach((b) =>
    b.addEventListener('click', () => {
      scope = SCOPES.find((s) => s.id === b.dataset.scope);
      render();
    }),
  );
  nextBtn.addEventListener('click', () => {
    const pruned = windowDates(offset)[0];
    offset++;
    const added = windowDates(offset)[SLOTS - 1];
    render(`Midnight: shard <code>${added}</code> created, <code>${pruned}</code> pruned.`);
  });
  resetBtn.addEventListener('click', () => {
    offset = 0;
    // Reset goes back to the state the diagram loads in, so today's shard
    // starts empty again and fills from scratch. It survives in the pool when
    // it is still inside the window, so its points have to be cleared.
    const today = pool.get(windowDates(0)[SLOTS - 1]);
    if (today) {
      today.count = 0;
      paintBars(today);
    }
    render();
  });

  render();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
