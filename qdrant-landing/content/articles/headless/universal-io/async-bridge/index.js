/*
 * Async bridge island for articles/universal-io.
 *
 * Traces three reads through the bridge between the synchronous pipeline and
 * the Tokio runtime. The caller thread schedules A, B, and C, then calls wait()
 * three times. Each wait() blocks until the next reply arrives, so results come
 * back in the order the reads finish (B, C, A), not the order they were
 * scheduled. Each read's slot maps the reply back to the caller's user data.
 *
 * Two compositions share one state: a wide one with time running left to right
 * (viewBox 760 wide) and a compact one with time running top to bottom (viewBox
 * 360 wide), used when the island is narrower than COMPACT_BELOW px so labels
 * stay near their real size on a phone. Both are built from one time/lane
 * mapping. The finish order is illustrative, not a measured latency. Pure SVG +
 * CSS on the shared island design system (islands.scss).
 */

let instanceId = 0;
const NS = 'http://www.w3.org/2000/svg';
const COMPACT_BELOW = 560;

// Time points along the main axis (x when wide, y when compact): the schedule
// calls, the wait() calls, and where each read finishes.
const TIMES = {
  wide: { sa: 150, sb: 215, sc: 280, w1: 330, eb: 400, w2: 440, ec: 520, w3: 560, ea: 680 },
  compact: { sa: 90, sb: 136, sc: 182, w1: 232, eb: 282, w2: 318, ec: 366, w3: 400, ea: 470 },
};
// Lane coordinate: the caller line, and each read's row (wide) or column (compact).
const LINE = { wide: 72, compact: 66 };
const LANE = {
  wide: { a: 166, b: 226, c: 286 },
  compact: { a: 154, b: 222, c: 290 },
};
const BAR = { wide: 28, compact: 62 };

const REQS = [
  { id: 'a', tag: 'A', slot: 0, step: 1, retStep: 6, from: 'sa', to: 'ea' },
  { id: 'b', tag: 'B', slot: 1, step: 2, retStep: 4, from: 'sb', to: 'eb' },
  { id: 'c', tag: 'C', slot: 2, step: 3, retStep: 5, from: 'sc', to: 'ec' },
];
// wait() calls: the step that shows them, where the caller blocks, and the read
// that unblocks them.
const WAITS = [
  { step: 4, at: 'w1', req: 'b' },
  { step: 5, at: 'w2', req: 'c' },
  { step: 6, at: 'w3', req: 'a' },
];
const req = (id) => REQS.find((r) => r.id === id);

const STEPS = [
  { label: 'schedule A' },
  { label: 'schedule B' },
  { label: 'schedule C' },
  { label: 'wait() → B' },
  { label: 'wait() → C' },
  { label: 'wait() → A' },
];

const STATUS = [
  'The caller thread is synchronous. It schedules reads and waits for results, while the async work runs on a dedicated Tokio runtime. Step through three reads to see the handoff.',
  '<code>schedule()</code> stores the caller\'s user data in slab slot 0 and spawns read A on a Tokio worker. It returns immediately.',
  'Read B gets slot 1 and its own worker. The caller never waits for A, so scheduling is cheap.',
  'Read C gets slot 2. Three reads are now in flight on the workers while the caller thread keeps running.',
  '<code>wait()</code> calls <code>blocking_recv</code>, so the caller blocks. B is the first to finish, and its reply carries slot 1, which maps back to B\'s user data.',
  'The next <code>wait()</code> returns C. A was scheduled first but is still running, so results come back in finish order, not scheduling order.',
  'The last <code>wait()</code> returns A through slot 0. Every reply has been matched back to its user data.',
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-br');
  const arrowId = `qi-br-arrow-${++instanceId}`;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <svg class="qi-svg qi-br__svg" viewBox="0 0 760 376" role="img"',
    '    aria-label="The bridge between the synchronous caller thread and the async Tokio workers. The caller schedules reads A, B, and C, each spawned onto a worker. It then calls wait() three times, blocking each time until a reply arrives. Replies return in the order the reads finish: B, then C, then A.">',
    '    <defs>',
    `      <marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">`,
    '        <path class="qi-br__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    '    <g class="qi-br__layer"></g>',
    '  </svg>',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <span class="qi-hint">Explore:</span>',
    STEPS.map(
      (s, i) => `<button type="button" class="qi-chip" data-step-btn="${i + 1}" aria-pressed="false"><span class="qi-br__num">${i + 1}</span>${s.label}</button>`,
    ).join(''),
    '    </div>',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-play>Play</button>',
    '      <button type="button" class="qi-chip" data-reset>Reset</button>',
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-status--3 qi-br__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-br__svg');
  const layer = node.querySelector('.qi-br__layer');
  const statusEl = node.querySelector('.qi-br__status');
  const stepBtns = [...node.querySelectorAll('[data-step-btn]')];
  const playBtn = node.querySelector('[data-play]');
  const resetBtn = node.querySelector('[data-reset]');

  // Start with the complete flow visible. The previous empty initial state made
  // the worker frame look like unused whitespace until a reader interacted.
  let step = STEPS.length;
  let timer = null;
  let compact = null;

  function build(isCompact) {
    layer.replaceChildren();
    const mode = isCompact ? 'compact' : 'wide';
    const t = TIMES[mode];
    const lineL = LINE[mode];
    const lane = LANE[mode];
    const barW = BAR[mode];
    svg.setAttribute('viewBox', isCompact ? '0 0 360 540' : '0 0 760 376');

    // (time, lane) -> (x, y): time runs along x when wide and along y when compact.
    const P = (a, l) => (isCompact ? { x: l, y: a } : { x: a, y: l });
    const pt = (a, l) => {
      const p = P(a, l);
      return `${p.x} ${p.y}`;
    };
    const line = (cls, a1, a2, l1, l2, extra) => {
      const p1 = P(a1, l1);
      const p2 = P(a2, l2);
      return el('line', { class: cls, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, ...extra });
    };
    const arrow = (cls, a, l1, l2) => el('path', { class: cls, d: `M ${pt(a, l1)} L ${pt(a, l2)}`, 'marker-end': `url(#${arrowId})` });

    // ── Lanes ──
    if (isCompact) {
      layer.appendChild(el('rect', { class: 'qi-frame', x: 2, y: 6, width: 128, height: 480, rx: 6 }));
      layer.appendChild(el('text', { class: 'qi-frame-label', x: 16, y: 28 }, 'caller thread'));
      layer.appendChild(el('text', { class: 'qi-frame-label', x: 16, y: 46 }, 'sync'));
      layer.appendChild(el('rect', { class: 'qi-frame', x: 138, y: 6, width: 220, height: 480, rx: 6 }));
      layer.appendChild(el('text', { class: 'qi-frame-label', x: 152, y: 28 }, 'io-bridge Tokio workers'));
      layer.appendChild(el('text', { class: 'qi-frame-label', x: 152, y: 46 }, 'async'));
    } else {
      layer.appendChild(el('rect', { class: 'qi-frame', x: 2, y: 6, width: 756, height: 104, rx: 6 }));
      layer.appendChild(el('text', { class: 'qi-frame-label', x: 16, y: 28 }, 'caller thread · sync'));
      layer.appendChild(el('rect', { class: 'qi-frame', x: 2, y: 126, width: 756, height: 210, rx: 6 }));
      layer.appendChild(el('text', { class: 'qi-frame-label', x: 16, y: 148 }, 'io-bridge Tokio workers · async'));
    }

    // Caller timeline: a faint base, then segments that appear with each step.
    layer.appendChild(line('qi-br__base', t.sa, t.ea, lineL, lineL));
    const seg = (a1, a2, blocked, s) =>
      line(`qi-br__seg${blocked ? ' qi-br__seg--blocked' : ''}`, a1, a2, lineL, lineL, { 'data-step': s });
    layer.appendChild(seg(t.sa, t.w1, false, 1));
    layer.appendChild(seg(t.w1, t.eb, true, 4));
    layer.appendChild(seg(t.eb, t.w2, false, 4));
    layer.appendChild(seg(t.w2, t.ec, true, 5));
    layer.appendChild(seg(t.ec, t.w3, false, 5));
    layer.appendChild(seg(t.w3, t.ea, true, 6));

    const dot = (a, r, s) => {
      const p = P(a, lineL);
      const g = el('g', { class: `qi-br__dot qi-br__req--${r.id}`, 'data-step': s });
      g.appendChild(el('circle', { cx: p.x, cy: p.y, r: 11 }));
      g.appendChild(el('text', { x: p.x, y: p.y + 4.5, 'text-anchor': 'middle' }, r.tag));
      return g;
    };

    // ── Reads: spawn arrow and worker bar ──
    REQS.forEach((r) => {
      const from = t[r.from];
      const to = t[r.to];
      const l = lane[r.id];
      const g = el('g', { class: `qi-br__req qi-br__req--${r.id}`, 'data-step': r.step, 'data-done': r.retStep });
      g.appendChild(arrow('qi-br__arrow', from, lineL + 13, l - 3));
      if (isCompact) {
        g.appendChild(el('rect', { class: 'qi-br__bar', x: l, y: from, width: barW, height: to - from, rx: 5 }));
        g.appendChild(el('text', { class: 'qi-br__bar-text', x: l + 6, y: from + 20 }, `read ${r.tag}`));
        g.appendChild(el('text', { class: 'qi-br__bar-text', x: l + 6, y: from + 38 }, `slot ${r.slot}`));
      } else {
        g.appendChild(el('rect', { class: 'qi-br__bar', x: from, y: l, width: to - from, height: barW, rx: 5 }));
        g.appendChild(el('text', { class: 'qi-br__bar-text', x: from + 10, y: l + 19 }, `read ${r.tag} · slot ${r.slot}`));
      }
      layer.appendChild(g);
      layer.appendChild(dot(from, r, r.step));
    });

    // ── wait() calls and their replies ──
    WAITS.forEach((w) => {
      const r = req(w.req);
      const at = t[w.at];
      const g = el('g', { class: `qi-br__wait qi-br__req--${r.id}`, 'data-step': w.step });
      g.appendChild(line('qi-br__tick', at, at, lineL - 8, lineL + 8));
      if (isCompact) g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: lineL + 14, y: at + 5 }, 'wait()'));
      else g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: at, y: lineL + 34, 'text-anchor': 'middle' }, 'wait()'));
      g.appendChild(arrow('qi-br__arrow qi-br__arrow--reply', t[r.to], lane[r.id] - 2, lineL + 14));
      layer.appendChild(g);
      layer.appendChild(dot(t[r.to], r, w.step));
    });
    if (isCompact) {
      layer.appendChild(el('text', { class: 'qi-label', x: lineL + 22, y: t.sa - 8, 'data-step': 1 }, 'spawn'));
      layer.appendChild(el('text', { class: 'qi-label', x: lineL + 22, y: t.ea - 8, 'data-step': 6 }, 'reply'));
    } else {
      layer.appendChild(el('text', { class: 'qi-label', x: 160, y: lineL + 34, 'data-step': 1 }, 'spawn'));
      layer.appendChild(el('text', { class: 'qi-label', x: 692, y: lineL + 34, 'data-step': 6 }, 'reply'));
    }

    // ── Legend ──
    const lg = el('g', { class: 'qi-br__legend' });
    const legendRows = isCompact
      ? [[16, 504, false, 'caller running'], [16, 524, true, 'caller blocked in wait()']]
      : [[16, 358, false, 'caller running'], [190, 358, true, 'caller blocked in wait()']];
    legendRows.forEach(([x, y, blocked, label]) => {
      lg.appendChild(el('line', { class: `qi-br__seg${blocked ? ' qi-br__seg--blocked' : ''}`, x1: x, y1: y, x2: x + 30, y2: y }));
      lg.appendChild(el('text', { class: 'qi-label', x: x + 38, y: y + 4 }, label));
    });
    layer.appendChild(lg);
  }

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    playBtn.textContent = 'Play';
  };

  function render() {
    stepBtns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.stepBtn) === step)));
    layer.querySelectorAll('[data-step]').forEach((n) => {
      const s = Number(n.getAttribute('data-step'));
      n.classList.toggle('is-shown', step >= s);
      n.classList.toggle('is-now', step === s);
      if (n.hasAttribute('data-done')) n.classList.toggle('is-done', step >= Number(n.getAttribute('data-done')));
    });
    statusEl.innerHTML = STATUS[step];
  }

  // Rebuild the drawing when the island crosses the compact threshold.
  function layout() {
    const width = node.getBoundingClientRect().width;
    if (width === 0) return;
    const isCompact = width < COMPACT_BELOW;
    if (isCompact === compact) return;
    compact = isCompact;
    node.classList.toggle('is-compact', isCompact);
    build(isCompact);
    render();
  }

  const goTo = (s) => {
    step = s;
    render();
  };

  stepBtns.forEach((b) =>
    b.addEventListener('click', () => {
      stop();
      // Pressing the active step again returns to the overview.
      goTo(step === Number(b.dataset.stepBtn) ? 0 : Number(b.dataset.stepBtn));
    }),
  );
  playBtn.addEventListener('click', () => {
    if (timer) return stop();
    if (step >= STEPS.length) goTo(0);
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      goTo(step + 1);
      if (step >= STEPS.length) stop();
    }, 1400);
  });
  resetBtn.addEventListener('click', () => {
    stop();
    goTo(0);
  });

  build(false);
  compact = false;
  render();
  layout();
  if (window.ResizeObserver) new ResizeObserver(layout).observe(node);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
