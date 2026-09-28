/*
 * edge-shard island — interactive replacement for qdrant-edge.png.
 *
 * Contrasts the two architectures side by side. On the left, Qdrant Server:
 * the application runs on the device, the shard lives in a server process, and
 * every ingest or query leaves the device and crosses the network. On the
 * right, Qdrant Edge: the Edge Shard is nested inside the application process,
 * inside the device frame, so the same operations never leave.
 *
 * Run an operation to send a packet down both wires. Flip "Network" to offline
 * and the server request dies at the boundary while Edge keeps answering.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss): chrome
 * colors switch with the host theme, operation hues stay constant.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (SVG user units).
const VB_W = 720;
const VB_H = 310;

// Panels.
const PA_X = 6;
const PB_X = 374;
const P_W = 340;
const P_Y = 34;
const P_H = 258;

// Server side (left).
const A_MID = PA_X + P_W / 2; // 176
const NET_Y = 172; // network boundary
const A_WIRE = `M ${A_MID} 126 L ${A_MID} 200`;

// Edge side (right).
const B_MID = PB_X + P_W / 2; // 544
const B_WIRE = `M ${B_MID} 118 L ${B_MID} 170`;

const OPS = {
  ingest: { label: 'Ingest', wire: 'ingest', verb: 'Upserting points' },
  query: { label: 'Query', wire: 'query', verb: 'Running a query' },
};

// Travel time in ms for one leg. The server wire is deliberately slower: the
// packet is standing in for a round trip over a link, not for CPU time.
const T_SERVER = 820;
const T_EDGE = 260;

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

export function mount(node) {
  node.classList.add('qi-edge');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group" role="group" aria-label="Run an operation">',
    '      <button type="button" class="qi-chip qi-edge__op" data-op="ingest">',
    '        <span class="qi-chip__swatch"></span>Ingest',
    '      </button>',
    '      <button type="button" class="qi-chip qi-edge__op" data-op="query">',
    '        <span class="qi-chip__swatch"></span>Query',
    '      </button>',
    '    </div>',
    '    <button type="button" class="qi-chip qi-edge__offline" aria-pressed="false">',
    '      <span class="qi-switch__track"><span class="qi-switch__knob"></span></span>',
    '      <span>Network: <b>online</b></span>',
    '    </button>',
    '  </div>',
    `  <svg class="qi-svg qi-edge__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`,
    '       aria-label="Side by side: with Qdrant Server the shard runs in a server process and every operation crosses the network off the device; with Qdrant Edge the Edge Shard runs inside the application process on the device, so ingest and query stay local.">',

    // ---- left panel: Qdrant Server ----
    `    <text class="qi-title" x="${A_MID}" y="22" text-anchor="middle">Qdrant Server</text>`,
    `    <rect class="qi-frame" x="${PA_X}" y="${P_Y}" width="${P_W}" height="${P_H}" rx="8"/>`,

    '    <g class="qi-edge__device">',
    '      <rect class="qi-edge__shell" x="36" y="56" width="280" height="80" rx="10"/>',
    '      <text class="qi-label" x="48" y="75">Device</text>',
    '      <rect class="qi-edge__box" x="56" y="82" width="240" height="44" rx="6"/>',
    `      <text class="qi-label qi-label--strong" x="${A_MID}" y="110" text-anchor="middle">Your application</text>`,
    '    </g>',

    `    <line class="qi-edge__net" x1="26" y1="${NET_Y}" x2="326" y2="${NET_Y}"/>`,
    `    <text class="qi-label qi-edge__net-label" x="26" y="${NET_Y - 10}">network</text>`,

    '    <rect class="qi-edge__shell" x="36" y="200" width="280" height="76" rx="10"/>',
    '    <text class="qi-label" x="48" y="219">Server</text>',
    '    <rect class="qi-edge__box qi-edge__box--store" x="56" y="226" width="240" height="42" rx="6"/>',
    `    <text class="qi-label qi-label--strong" x="${A_MID}" y="246" text-anchor="middle">Shard</text>`,
    `    <text class="qi-label" x="${A_MID}" y="261" text-anchor="middle">vectors, payload, index</text>`,

    `    <path class="qi-edge__wire qi-edge__wire--a" d="${A_WIRE}"/>`,
    `    <text class="qi-label qi-edge__wire-label qi-edge__wire-label--a" x="${A_MID + 12}" y="166"></text>`,
    `    <g class="qi-edge__cross" transform="translate(${A_MID} ${NET_Y})">`,
    '      <line x1="-7" y1="-7" x2="7" y2="7"/>',
    '      <line x1="-7" y1="7" x2="7" y2="-7"/>',
    '    </g>',
    '    <circle class="qi-edge__packet qi-edge__packet--a" r="5.5" cx="-20" cy="-20"/>',

    // ---- right panel: Qdrant Edge ----
    `    <text class="qi-title" x="${B_MID}" y="22" text-anchor="middle">Qdrant Edge</text>`,
    `    <rect class="qi-frame" x="${PB_X}" y="${P_Y}" width="${P_W}" height="${P_H}" rx="8"/>`,

    '    <rect class="qi-edge__shell" x="404" y="56" width="280" height="220" rx="10"/>',
    '    <text class="qi-label" x="416" y="75">Device</text>',
    '    <rect class="qi-edge__box" x="424" y="82" width="240" height="176" rx="6"/>',
    `    <text class="qi-label qi-label--strong" x="${B_MID}" y="106" text-anchor="middle">Your application</text>`,
    '    <rect class="qi-edge__box qi-edge__box--store" x="444" y="170" width="200" height="76" rx="6"/>',
    `    <text class="qi-label qi-label--strong" x="${B_MID}" y="200" text-anchor="middle">Edge Shard</text>`,
    `    <text class="qi-label" x="${B_MID}" y="216" text-anchor="middle">vectors, payload, index</text>`,

    `    <path class="qi-edge__wire qi-edge__wire--b" d="${B_WIRE}"/>`,
    `    <text class="qi-label qi-edge__wire-label qi-edge__wire-label--b" x="${B_MID + 12}" y="148"></text>`,
    '    <circle class="qi-edge__packet qi-edge__packet--b" r="5.5" cx="-20" cy="-20"/>',

    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-edge__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const wireA = node.querySelector('.qi-edge__wire--a');
  const wireB = node.querySelector('.qi-edge__wire--b');
  const packetA = node.querySelector('.qi-edge__packet--a');
  const packetB = node.querySelector('.qi-edge__packet--b');
  const labelA = node.querySelector('.qi-edge__wire-label--a');
  const labelB = node.querySelector('.qi-edge__wire-label--b');
  const statusEl = node.querySelector('.qi-edge__status');
  const offlineBtn = node.querySelector('.qi-edge__offline');
  const offlineLabel = offlineBtn.querySelector('b');
  const opBtns = [...node.querySelectorAll('.qi-edge__op')];

  let offline = false;
  let op = null;
  let raf = null;
  let token = 0;

  // Fraction of the server wire that sits above the network boundary. The
  // packet dies there when the link is down.
  const lenA = wireA.getTotalLength();
  const cutA = (() => {
    const p0 = wireA.getPointAtLength(0);
    const p1 = wireA.getPointAtLength(lenA);
    return (NET_Y - p0.y) / (p1.y - p0.y);
  })();

  function place(packet, wire, t) {
    const p = wire.getPointAtLength(wire.getTotalLength() * Math.max(0, Math.min(1, t)));
    packet.setAttribute('cx', p.x);
    packet.setAttribute('cy', p.y);
  }

  function park(packet) {
    packet.classList.remove('is-on', 'is-lost');
    packet.setAttribute('cx', -20);
    packet.setAttribute('cy', -20);
  }

  // Walks `legs` (each a [from, to, ms] tuple) and calls done() at the end.
  function run(packet, wire, legs, mine, done) {
    let i = 0;
    let start = null;
    packet.classList.add('is-on');

    function step(now) {
      if (mine !== token) return;
      if (start == null) start = now;
      const [from, to, ms] = legs[i];
      const k = Math.min(1, (now - start) / ms);
      place(packet, wire, from + (to - from) * k);
      if (k < 1) {
        raf = requestAnimationFrame(step);
        return;
      }
      i += 1;
      start = null;
      if (i < legs.length) {
        raf = requestAnimationFrame(step);
      } else if (done) {
        done();
      }
    }
    raf = requestAnimationFrame(step);
  }

  function setStatus(a, b) {
    statusEl.innerHTML = `${a}<br>${b}`;
  }

  function idle() {
    setStatus(
      'Run an operation to send it down both paths.',
      'Take the network offline to see which side keeps working.',
    );
  }

  function play(nextOp) {
    token += 1;
    const mine = token;
    if (raf) cancelAnimationFrame(raf);
    op = nextOp;

    opBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.op === op));
    node.classList.toggle('is-ingest', op === 'ingest');
    node.classList.toggle('is-query', op === 'query');
    labelA.textContent = OPS[op].wire;
    labelB.textContent = OPS[op].wire;

    park(packetA);
    park(packetB);
    node.classList.remove('is-lost');

    const verb = OPS[op].verb;

    if (offline) {
      packetA.classList.add('is-lost');
      run(packetA, wireA, [[0, cutA, T_SERVER * cutA]], mine, () => {
        if (mine !== token) return;
        node.classList.add('is-lost');
        packetA.classList.remove('is-on');
      });
    } else {
      run(
        packetA,
        wireA,
        [
          [0, 1, T_SERVER],
          [1, 0, T_SERVER],
        ],
        mine,
        () => mine === token && packetA.classList.remove('is-on'),
      );
    }

    run(
      packetB,
      wireB,
      [
        [0, 1, T_EDGE],
        [1, 0, T_EDGE],
      ],
      mine,
      () => mine === token && packetB.classList.remove('is-on'),
    );

    const a = offline
      ? `<b>Server:</b> ${verb} fails. The shard is on the far side of a link that is down.`
      : `<b>Server:</b> ${verb} leaves the device and crosses the network twice, out and back.`;
    const b = `<b>Edge:</b> ${verb} is a function call inside the application process. No server, no network hop.`;
    setStatus(a, b);
  }

  opBtns.forEach((btn) => {
    btn.addEventListener('click', () => play(btn.dataset.op));
  });

  offlineBtn.addEventListener('click', () => {
    offline = !offline;
    offlineBtn.setAttribute('aria-pressed', String(offline));
    offlineLabel.textContent = offline ? 'offline' : 'online';
    node.classList.toggle('is-offline', offline);
    if (op) play(op);
    else idle();
  });

  idle();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
