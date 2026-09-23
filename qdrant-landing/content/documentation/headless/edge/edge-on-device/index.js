/*
 * edge-on-device island — alternative replacement for qdrant-edge.png.
 *
 * Draws one boundary and puts everything that matters inside it: the device
 * holds the application process, the application process holds the Edge Shard,
 * and both ingest and query run down lanes that never cross the boundary. A
 * Qdrant server sits outside it, dimmed, because Edge does not need one.
 *
 * Turning sync on brings the server up and animates the one path that does
 * cross the network, so the page can say "no server required" without implying
 * that a server can never be involved.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss): chrome
 * colors switch with the host theme, operation hues stay constant.
 */

// Geometry (SVG user units).
const VB_W = 720;
const VB_H = 340;

// On-device column.
const DEV_MID = 242;
const CODE_B = 152; // bottom of the "Your code" box
const SHARD_T = 212; // top of the Edge Shard box
const ING_X = 170;
const QRY_X = 314;

// Off-device column.
const DIV_X = 500; // the network boundary
const OFF_MID = 625;
const LINK_Y = 198;
const LINK_X0 = 478;
const LINK_X1 = 540;

const OPS = {
  ingest: { verb: 'Upserting points' },
  query: { verb: 'Running a query' },
};

const T_LANE = 460; // one leg, on device
const T_LINK = 900; // one leg, across the network

export function mount(node) {
  node.classList.add('qi-eod');

  const arrow = (x, y, up) =>
    up
      ? `M ${x} ${y} l -5 9 l 10 0 Z`
      : `M ${x} ${y} l -5 -9 l 10 0 Z`;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group" role="group" aria-label="Run an operation">',
    '      <button type="button" class="qi-chip qi-eod__op" data-op="ingest">',
    '        <span class="qi-chip__swatch"></span>Ingest',
    '      </button>',
    '      <button type="button" class="qi-chip qi-eod__op" data-op="query">',
    '        <span class="qi-chip__swatch"></span>Query',
    '      </button>',
    '    </div>',
    '    <button type="button" class="qi-chip qi-eod__sync" aria-pressed="false">',
    '      <span class="qi-switch__track"><span class="qi-switch__knob"></span></span>',
    '      <span>Optional sync: <b>off</b></span>',
    '    </button>',
    '  </div>',
    `  <svg class="qi-svg qi-eod__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`,
    '       aria-label="A device frame holds the application process, which holds the Edge Shard. Ingest and query run inside that frame and never cross the network boundary. A Qdrant server sits outside it, dimmed, as an optional sync target.">',

    // ---- column headings ----
    `    <text class="qi-title" x="${DEV_MID}" y="20" text-anchor="middle">On the device</text>`,
    `    <text class="qi-title qi-eod__off-title" x="${OFF_MID}" y="20" text-anchor="middle">Off the device</text>`,

    // ---- the boundary ----
    `    <line class="qi-eod__divider" x1="${DIV_X}" y1="34" x2="${DIV_X}" y2="326"/>`,

    // ---- device ----
    '    <rect class="qi-eod__shell" x="6" y="34" width="472" height="292" rx="10"/>',
    '    <text class="qi-label" x="22" y="54">Device</text>',
    '    <rect class="qi-eod__box" x="30" y="64" width="424" height="250" rx="8"/>',
    `    <text class="qi-label" x="${DEV_MID}" y="86" text-anchor="middle">Your application, one process</text>`,

    '    <rect class="qi-eod__box qi-eod__box--code" x="70" y="100" width="344" height="52" rx="6"/>',
    `    <text class="qi-label qi-label--strong" x="${DEV_MID}" y="132" text-anchor="middle">Application logic</text>`,

    '    <rect class="qi-eod__box qi-eod__box--store" x="70" y="212" width="344" height="86" rx="6"/>',
    `    <text class="qi-label qi-label--strong" x="${DEV_MID}" y="246" text-anchor="middle">Edge Shard</text>`,
    `    <text class="qi-label" x="${DEV_MID}" y="266" text-anchor="middle">vectors, payload, index</text>`,

    // ---- the two local lanes ----
    '    <g class="qi-eod__lane qi-eod__lane--ingest">',
    `      <line class="qi-eod__wire" x1="${ING_X}" y1="${CODE_B}" x2="${ING_X}" y2="${SHARD_T}"/>`,
    `      <path class="qi-eod__head" d="${arrow(ING_X, SHARD_T, false)}"/>`,
    `      <text class="qi-label qi-eod__lane-label" x="${ING_X - 12}" y="${(CODE_B + SHARD_T) / 2 + 4}" text-anchor="end">ingest</text>`,
    `      <circle class="qi-eod__packet" r="5.5" cx="${ING_X}" cy="${CODE_B}"/>`,
    '    </g>',
    '    <g class="qi-eod__lane qi-eod__lane--query">',
    `      <line class="qi-eod__wire" x1="${QRY_X}" y1="${CODE_B}" x2="${QRY_X}" y2="${SHARD_T}"/>`,
    `      <path class="qi-eod__head" d="${arrow(QRY_X, SHARD_T, false)}"/>`,
    `      <path class="qi-eod__head" d="${arrow(QRY_X, CODE_B, true)}"/>`,
    `      <text class="qi-label qi-eod__lane-label" x="${QRY_X + 12}" y="${(CODE_B + SHARD_T) / 2 + 4}" text-anchor="start">query</text>`,
    `      <circle class="qi-eod__packet" r="5.5" cx="${QRY_X}" cy="${CODE_B}"/>`,
    '    </g>',

    // ---- the server that Edge does not need ----
    '    <g class="qi-eod__off">',
    `      <rect class="qi-eod__shell" x="540" y="150" width="170" height="96" rx="10"/>`,
    `      <text class="qi-label qi-label--strong" x="${OFF_MID}" y="192" text-anchor="middle">Qdrant Server</text>`,
    `      <text class="qi-label qi-eod__off-note" x="${OFF_MID}" y="212" text-anchor="middle">not required</text>`,
    `      <line class="qi-eod__link" x1="${LINK_X0}" y1="${LINK_Y}" x2="${LINK_X1}" y2="${LINK_Y}"/>`,
    `      <circle class="qi-eod__packet qi-eod__packet--link" r="5.5" cx="${LINK_X0}" cy="${LINK_Y}"/>`,
    '    </g>',

    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-eod__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const laneIngest = node.querySelector('.qi-eod__lane--ingest');
  const laneQuery = node.querySelector('.qi-eod__lane--query');
  const dotIngest = laneIngest.querySelector('.qi-eod__packet');
  const dotQuery = laneQuery.querySelector('.qi-eod__packet');
  const dotLink = node.querySelector('.qi-eod__packet--link');
  const offNote = node.querySelector('.qi-eod__off-note');
  const statusEl = node.querySelector('.qi-eod__status');
  const syncBtn = node.querySelector('.qi-eod__sync');
  const syncLabel = syncBtn.querySelector('b');
  const opBtns = [...node.querySelectorAll('.qi-eod__op')];

  let sync = false;
  let op = null;
  let raf = null;
  let token = 0;

  // Walks `legs` (each a [from, to, ms] tuple) along a straight segment.
  function run(dot, axis, a, b, legs, mine, done) {
    let i = 0;
    let start = null;
    dot.classList.add('is-on');

    function step(now) {
      if (mine !== token) return;
      if (start == null) start = now;
      const [from, to, ms] = legs[i];
      const k = Math.min(1, (now - start) / ms);
      const t = from + (to - from) * k;
      dot.setAttribute(axis, a + (b - a) * t);
      if (k < 1) {
        raf = requestAnimationFrame(step);
        return;
      }
      i += 1;
      start = null;
      if (i < legs.length) raf = requestAnimationFrame(step);
      else if (done) done();
    }
    raf = requestAnimationFrame(step);
  }

  function park() {
    [dotIngest, dotQuery, dotLink].forEach((d) => d.classList.remove('is-on'));
    dotIngest.setAttribute('cy', CODE_B);
    dotQuery.setAttribute('cy', CODE_B);
    dotLink.setAttribute('cx', LINK_X0);
  }

  function setStatus(a, b) {
    statusEl.innerHTML = `${a}<br>${b}`;
  }

  function syncLine() {
    return sync
      ? '<b>Sync:</b> pushing to a server is optional, for backups, heavier indexing, or sharing data between devices.'
      : '<b>Sync:</b> no server, no network. The shard is the application’s own storage.';
  }

  function idle() {
    setStatus('Run an operation to follow it through the device.', syncLine());
  }

  function play(nextOp) {
    token += 1;
    const mine = token;
    if (raf) cancelAnimationFrame(raf);
    op = nextOp;

    opBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.op === op));
    node.classList.toggle('is-ingest', op === 'ingest');
    node.classList.toggle('is-query', op === 'query');
    laneIngest.classList.toggle('is-muted', op !== 'ingest');
    laneQuery.classList.toggle('is-muted', op !== 'query');

    park();

    if (op === 'ingest') {
      run(dotIngest, 'cy', CODE_B, SHARD_T, [[0, 1, T_LANE]], mine, () => {
        if (mine !== token) return;
        dotIngest.classList.remove('is-on');
        if (sync) {
          run(dotLink, 'cx', LINK_X0, LINK_X1, [[0, 1, T_LINK]], mine, () => {
            if (mine === token) dotLink.classList.remove('is-on');
          });
        }
      });
    } else {
      run(
        dotQuery,
        'cy',
        CODE_B,
        SHARD_T,
        [
          [0, 1, T_LANE],
          [1, 0, T_LANE],
        ],
        mine,
        () => mine === token && dotQuery.classList.remove('is-on'),
      );
    }

    const local =
      op === 'ingest'
        ? `<b>Ingest:</b> ${OPS.ingest.verb} writes straight into the Edge Shard, in the same process.`
        : `<b>Query:</b> ${OPS.query.verb} reads the shard and returns results without leaving the process.`;
    setStatus(local, syncLine());
  }

  opBtns.forEach((btn) => btn.addEventListener('click', () => play(btn.dataset.op)));

  syncBtn.addEventListener('click', () => {
    sync = !sync;
    syncBtn.setAttribute('aria-pressed', String(sync));
    syncLabel.textContent = sync ? 'on' : 'off';
    node.classList.toggle('is-sync', sync);
    offNote.textContent = sync ? 'backup and indexing' : 'not required';
    if (op) play(op);
    else idle();
  });

  idle();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
