/*
 * write-consistency-factor island.
 *
 * A client writes one point to a shard with three replicas. The write goes to
 * every replica in parallel; each online replica applies it and acknowledges.
 * The client gets OK as soon as `write_consistency_factor` replicas have
 * acknowledged, or an error if that many never do.
 *
 * Controls under the diagram: the factor (1 to 3) and which of Peer 2 /
 * Peer 3 are online. Write plays the process.
 * Same visual language as the concurrent-writes island.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 268).
const VB_W = 760;
const VB_H = 268;
const FRAME = { x: 2, y: 96, w: 756, h: 168 };
const BOX = { y: 132, w: 200, h: 112 };
const BOX_X = [38, 280, 522];
const CX = BOX_X.map((x) => x + BOX.w / 2);
const SQ = 40;
const DIA = { hw: 46, hh: 26 };
const CLIENT = { x: CX[1], y: 34 };
const JUNCTION_Y = 80;

const APPLY_AT = [450, 800, 1150]; // ms after Write, per replica
const TIMEOUT_AT = 1900;
const WCF = 'write_consistency_factor';

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}
const diamond = (x, y) => `${x},${y - DIA.hh} ${x + DIA.hw},${y} ${x},${y + DIA.hh} ${x - DIA.hw},${y}`;

// Wire from the junction down to a replica box, with a rounded corner.
function drop(x) {
  const end = BOX.y - 6;
  if (x === CLIENT.x) return `M ${x} ${CLIENT.y + DIA.hh} V ${end}`;
  const d = x > CLIENT.x ? 1 : -1;
  return `M ${CLIENT.x} ${CLIENT.y + DIA.hh} V ${JUNCTION_Y - 12} Q ${CLIENT.x} ${JUNCTION_Y} ${CLIENT.x + d * 12} ${JUNCTION_Y} H ${x - d * 12} Q ${x} ${JUNCTION_Y} ${x} ${JUNCTION_Y + 12} V ${end}`;
}

export function mount(node) {
  node.classList.add('qi-wcf');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-write>',
    '        <svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>Write',
    '      </button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-wcf__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`,
    '    aria-label="A client writes a point to three replicas in parallel and waits for the number of acknowledgments set by the write consistency factor.">',
    '    <defs>',
    '      <marker id="qi-wcf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">',
    '        <path class="qi-wcf__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '      <marker id="qi-wcf-arrow-off" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">',
    '        <path class="qi-wcf__arrowhead qi-wcf__arrowhead--off" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    `    <rect class="qi-frame" x="${FRAME.x}" y="${FRAME.y}" width="${FRAME.w}" height="${FRAME.h}" rx="6"/>`,
    `    <text class="qi-frame-label" x="${FRAME.x + 16}" y="${FRAME.y + 22}">Shard</text>`,
    '    <g class="qi-wcf__boxes"></g>',
    '    <g class="qi-wcf__wires"></g>',
    `    <polygon class="qi-wcf__client" points="${diamond(CLIENT.x, CLIENT.y)}"/>`,
    `    <text class="qi-wcf__client-text" x="${CLIENT.x}" y="${CLIENT.y + 4}">Client</text>`,
    `    <text class="qi-label qi-label--strong qi-wcf__count" x="${CLIENT.x + DIA.hw + 16}" y="${CLIENT.y - 4}"></text>`,
    `    <text class="qi-wcf__result" x="${CLIENT.x + DIA.hw + 16}" y="${CLIENT.y + 14}"></text>`,
    '  </svg>',
    '  <div class="qi-controls">',
    `    <div class="qi-group" role="group" aria-label="${WCF}">`,
    `      <span class="qi-hint">${WCF}:</span>`,
    [1, 2, 3].map((n) => `<button type="button" class="qi-chip" data-wcf="${n}" aria-pressed="false">${n}</button>`).join(''),
    '    </div>',
    '    <div class="qi-group">',
    '      <span class="qi-hint">Online:</span>',
    [1, 2]
      .map(
        (i) =>
          `<button type="button" class="qi-chip" data-peer="${i}" aria-pressed="true">` +
          `<span class="qi-switch__track"><span class="qi-switch__knob"></span></span>Peer ${i + 1}</button>`,
      )
      .join(''),
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-wcf__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-wcf__svg');
  const boxesG = svg.querySelector('.qi-wcf__boxes');
  const wiresG = svg.querySelector('.qi-wcf__wires');
  const countEl = svg.querySelector('.qi-wcf__count');
  const resultEl = svg.querySelector('.qi-wcf__result');
  const statusEl = node.querySelector('.qi-wcf__status');
  const writeBtn = node.querySelector('[data-write]');
  const wcfBtns = [...node.querySelectorAll('[data-wcf]')];
  const peerBtns = [...node.querySelectorAll('[data-peer]')];

  const peers = CX.map((cx, i) => {
    const g = el('g', { class: 'qi-wcf__peer' }, boxesG);
    el('rect', { class: 'qi-wcf__box', x: BOX_X[i], y: BOX.y, width: BOX.w, height: BOX.h, rx: 6 }, g);
    el('text', { class: 'qi-title', x: cx, y: BOX.y + 24, 'text-anchor': 'middle' }, g).textContent = `Peer ${i + 1}`;
    const sq = el('rect', { class: 'qi-wcf__point', x: cx - SQ / 2, y: BOX.y + 36, width: SQ, height: SQ, rx: 4 }, g);
    const note = el('text', { class: 'qi-label', x: cx, y: BOX.y + BOX.h - 12, 'text-anchor': 'middle' }, g);
    const wire = el('path', { class: 'qi-wcf__wire', d: drop(cx), 'marker-end': 'url(#qi-wcf-arrow)' }, wiresG);
    return { i, g, sq, note, wire, online: true, applied: false };
  });

  let factor = 1;
  let acks = 0;
  let running = false;
  let timers = [];
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));

  function render() {
    wcfBtns.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.wcf === factor)));
    peerBtns.forEach((b) => b.setAttribute('aria-pressed', String(peers[+b.dataset.peer].online)));
    writeBtn.disabled = running;
    peers.forEach((p) => {
      p.g.classList.toggle('is-offline', !p.online);
      p.wire.classList.toggle('is-offline', !p.online);
      p.wire.setAttribute('marker-end', p.online ? 'url(#qi-wcf-arrow)' : 'url(#qi-wcf-arrow-off)');
      p.sq.classList.toggle('is-on', p.applied);
      p.note.textContent = !p.online ? 'offline' : p.applied ? '✓ acknowledged' : '';
    });
    countEl.textContent = `acks: ${acks} of ${factor} needed`;
  }

  function reset() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    running = false;
    acks = 0;
    peers.forEach((p) => {
      p.applied = false;
      p.wire.classList.remove('is-on');
    });
    resultEl.textContent = '';
    resultEl.classList.remove('is-error');
    const online = peers.filter((p) => p.online).length;
    statusEl.innerHTML =
      `With <code>${WCF}=${factor}</code>, the write succeeds once ${factor} of the 3 replicas acknowledge it. ` +
      (online < 3 ? `${online} of 3 are online. ` : '') +
      'Press Write.';
    render();
  }

  function finish(ok) {
    resultEl.textContent = ok ? 'OK' : 'Error';
    resultEl.classList.toggle('is-error', !ok);
  }

  function write() {
    if (running) return;
    reset();
    running = true;
    render();
    peers.forEach((p) => p.wire.classList.add('is-on'));
    statusEl.innerHTML = 'The write goes to every replica in parallel…';

    const online = peers.filter((p) => p.online);
    const offline = peers.filter((p) => !p.online).map((p) => `Peer ${p.i + 1}`);
    let answered = false;

    online.forEach((p) =>
      later(() => {
        p.applied = true;
        acks++;
        render();
        if (!answered && acks >= factor) {
          answered = true;
          finish(true);
          const more = online.length > acks;
          statusEl.innerHTML =
            `${acks} acknowledgment${acks > 1 ? 's' : ''} in, so the client gets <b>OK</b>.` +
            (more ? ' The other replicas still apply the write after the answer.' : '');
        } else if (!answered) {
          statusEl.innerHTML = `Peer ${p.i + 1} acknowledged: ${acks} of ${factor} needed…`;
        }
      }, APPLY_AT[p.i]),
    );

    // Whether the factor can be met is known up front: it depends only on
    // how many replicas are online.
    const canMeet = online.length >= factor;
    const lastAt = Math.max(...online.map((p) => APPLY_AT[p.i]));
    later(
      () => {
        if (!canMeet) {
          finish(false);
          statusEl.innerHTML =
            `Only ${acks} of 3 replicas acknowledged, fewer than <code>${WCF}=${factor}</code>. ` +
            'The write fails but may be partially applied, so the client must send it again.';
        } else if (offline.length) {
          statusEl.innerHTML =
            `${acks} of 3 replicas acknowledged, which meets <code>${WCF}=${factor}</code>, so the write succeeds. ` +
            `${offline.join(' and ')} missed it and ${offline.length > 1 ? 'are' : 'is'} recovered automatically once back online.`;
        } else {
          statusEl.innerHTML = `All 3 replicas applied the write. <code>${WCF}=${factor}</code> only decides how many of them the client waits for.`;
        }
        peers.forEach((p) => p.wire.classList.remove('is-on'));
        running = false;
        render();
      },
      canMeet ? lastAt + 700 : TIMEOUT_AT,
    );
  }

  writeBtn.addEventListener('click', write);
  wcfBtns.forEach((b) =>
    b.addEventListener('click', () => {
      factor = +b.dataset.wcf;
      reset();
    }),
  );
  peerBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const p = peers[+b.dataset.peer];
      p.online = !p.online;
      reset();
    }),
  );

  reset();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
