/*
 * governance island: interactive replacement for governance.png in the
 * "Video Anomaly Detection Part 3" tutorial.
 *
 * Shows the two halves of baseline governance as a column of checks: the
 * admission pipeline (contamination check, quarantine, re-score, per-scene
 * cap) and the hourly scrub (retention window, re-score). Each chip is a
 * scenario: it highlights the path one clip takes and where it ends up.
 *
 * The thresholds are the defaults of the memory governor
 * (backend/memory.py in qdrant/video-anomaly-edge): contamination threshold
 * 0.025, quarantine of 3600 s, retention of 7 days, per-scene cap of 500, scrub
 * every 3600 s with a removal threshold of 1.5 x 0.025 = 0.0375. The scenarios
 * are illustrative: they show the branches of the code, not measured clips.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). A single
 * layout works at every width; the stage is capped so text keeps its size.
 */

const NS = 'http://www.w3.org/2000/svg';

const NODE_W = 230;
const NODE_H = 52;
const GAP = 26;
const REJ_X = 270;
const REJ_W = 90;

const VIEWS = {
  admission: {
    nodes: [
      { id: 'cand', t: 'Baseline candidate', s: 'a clip that looks normal' },
      { id: 'check', t: 'Contamination check', s: 'score ≤ 0.025', fail: true },
      { id: 'quar', t: 'Quarantine', s: 'held for 1 hour' },
      { id: 'rescore', t: 'Re-score', s: 'score ≤ 0.025 again', fail: true },
      { id: 'cap', t: 'Per-scene cap', s: 'fewer than 500 clips', fail: true },
      { id: 'out', t: 'Admitted', s: 'joins the baseline', kind: 'ok' },
    ],
    reject: 'Rejected',
  },
  scrub: {
    nodes: [
      { id: 'entry', t: 'Baseline entry', s: 'checked every hour' },
      { id: 'age', t: 'Retention window', s: 'added ≤ 7 days ago', fail: true },
      { id: 'rescore', t: 'Re-score', s: 'score ≤ 0.0375', fail: true },
      { id: 'out', t: 'Kept', s: 'stays in the baseline', kind: 'ok' },
    ],
    reject: 'Removed',
  },
};

// Each scenario follows one clip. `path` lists the nodes it visits; a path that
// ends in `reject` leaves the column at the last node before it.
const SCENARIOS = [
  {
    group: 'Admission',
    label: 'Clean clip',
    view: 'admission',
    path: ['cand', 'check', 'quar', 'rescore', 'cap', 'out'],
    text: '<b>Clean clip.</b> Its score is at most 0.025 on arrival and again after one hour in quarantine, and the scene has room, so the clip joins the baseline.',
  },
  {
    group: 'Admission',
    label: 'Contaminated on arrival',
    view: 'admission',
    path: ['cand', 'check', 'reject'],
    text: '<b>Contaminated on arrival.</b> A score above 0.025 means the clip probably contains an anomaly. It is rejected immediately and never enters quarantine.',
  },
  {
    group: 'Admission',
    label: 'Contaminated after 1 hour',
    view: 'admission',
    path: ['cand', 'check', 'quar', 'rescore', 'reject'],
    text: '<b>Contaminated after 1 hour.</b> The clip looked normal on arrival, but when it is re-scored against the current baseline after quarantine its score is above 0.025. It is rejected.',
  },
  {
    group: 'Admission',
    label: 'Scene is full',
    view: 'admission',
    path: ['cand', 'check', 'quar', 'rescore', 'cap', 'reject'],
    text: '<b>Scene is full.</b> A scene that already holds 500 clips rejects new ones, so a flooded camera feed cannot take over the baseline. Nothing is evicted; scrubbing frees room by removing old or contaminated entries.',
  },
  {
    group: 'Hourly scrub',
    label: 'Older than 7 days',
    view: 'scrub',
    path: ['entry', 'age', 'reject'],
    text: '<b>Older than 7 days.</b> The scrub removes entries that are outside the retention window, so the baseline follows how the scene looks now.',
  },
  {
    group: 'Hourly scrub',
    label: 'Score above 0.0375',
    view: 'scrub',
    path: ['entry', 'age', 'rescore', 'reject'],
    text: '<b>Score above 0.0375.</b> Every remaining entry is re-scored against the current baseline. One that now scores above 1.5 times the contamination threshold, 0.0375, is removed.',
  },
  {
    group: 'Hourly scrub',
    label: 'Still clean',
    view: 'scrub',
    path: ['entry', 'age', 'rescore', 'out'],
    text: '<b>Still clean.</b> The entry is recent enough and still scores as normal, so it stays in the baseline until the next scrub.',
  },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-gv');
  const uid = Math.random().toString(36).slice(2, 7);

  const groups = [...new Set(SCENARIOS.map((s) => s.group))];
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    groups
      .map(
        (g) =>
          `    <div class="qi-group" role="group" aria-label="${g} scenario"><span class="qi-hint">${g}</span>` +
          SCENARIOS.map((s, i) => (s.group === g ? `<button type="button" class="qi-chip qi-gv__scn" data-scn="${i}" aria-pressed="false">${s.label}</button>` : '')).join('') +
          '</div>',
      )
      .join(''),
    '  </div>',
    '  <svg class="qi-svg qi-gv__svg" role="img"></svg>',
    '  <p class="qi-status qi-gv__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-gv__svg');
  const statusEl = node.querySelector('.qi-gv__status');
  const btns = [...node.querySelectorAll('.qi-gv__scn')];

  let current = 0;

  function render() {
    const sc = SCENARIOS[current];
    const view = VIEWS[sc.view];
    const onPath = new Set(sc.path);
    const rejected = sc.path[sc.path.length - 1] === 'reject';
    const failNode = rejected ? sc.path[sc.path.length - 2] : null;

    svg.replaceChildren();
    const defs = el('defs', {});
    const marker = el('marker', { id: `qi-gv-${uid}`, markerUnits: 'userSpaceOnUse', markerWidth: 10, markerHeight: 10, refX: 9, refY: 5, orient: 'auto' });
    marker.appendChild(el('path', { d: 'M0 0 L10 5 L0 10 z', class: 'qi-gv__head' }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    const pos = view.nodes.map((_, i) => 2 + i * (NODE_H + GAP));
    const height = pos[pos.length - 1] + NODE_H + 2;
    const cx = NODE_W / 2;

    // Where the rejection column sits: it spans the nodes that can fail.
    const failing = view.nodes.map((n, i) => (n.fail ? i : -1)).filter((i) => i >= 0);
    const rejTop = pos[failing[0]] + NODE_H / 2 - 22;
    const rejBottom = pos[failing[failing.length - 1]] + NODE_H / 2 + 22;

    // Connections between consecutive nodes
    view.nodes.forEach((n, i) => {
      if (i === 0) return;
      const used = onPath.has(n.id) && onPath.has(view.nodes[i - 1].id);
      svg.appendChild(el('path', { class: `qi-gv__edge${used ? ' is-on' : ''}`, d: `M${cx} ${pos[i - 1] + NODE_H} V${pos[i] - 2}`, fill: 'none', 'marker-end': `url(#qi-gv-${uid})` }));
    });
    // Arrows into the rejection column
    failing.forEach((i) => {
      const n = view.nodes[i];
      const used = failNode === n.id;
      const y = pos[i] + NODE_H / 2;
      svg.appendChild(el('path', { class: `qi-gv__edge qi-gv__edge--bad${used ? ' is-on' : ''}`, d: `M${NODE_W} ${y} H${REJ_X - 2}`, fill: 'none', 'marker-end': `url(#qi-gv-${uid})` }));
    });

    // Rejection column
    const rej = el('g', { class: `qi-gv__node qi-gv__node--bad${rejected ? ' is-on' : ' is-off'}` });
    rej.appendChild(el('rect', { class: 'qi-gv__rect', x: REJ_X + 0.5, y: rejTop + 0.5, width: REJ_W - 1, height: rejBottom - rejTop - 1, rx: 8 }));
    rej.appendChild(el('text', { class: 'qi-title qi-gv__text', x: REJ_X + REJ_W / 2, y: (rejTop + rejBottom) / 2 + 5, 'text-anchor': 'middle' }, view.reject));
    svg.appendChild(rej);

    // Nodes
    view.nodes.forEach((n, i) => {
      const on = onPath.has(n.id);
      const g = el('g', { class: `qi-gv__node${n.kind === 'ok' ? ' qi-gv__node--ok' : ''}${on ? ' is-on' : ' is-off'}` });
      g.appendChild(el('rect', { class: 'qi-gv__rect', x: 0.5, y: pos[i] + 0.5, width: NODE_W - 1, height: NODE_H - 1, rx: 8 }));
      g.appendChild(el('text', { class: 'qi-title qi-gv__text', x: 12, y: pos[i] + 22 }, n.t));
      g.appendChild(el('text', { class: 'qi-label qi-gv__sub', x: 12, y: pos[i] + 42 }, n.s));
      svg.appendChild(g);
    });

    svg.setAttribute('viewBox', `0 0 360 ${height}`);
    svg.setAttribute('aria-label', `${sc.label}: ${sc.path.map((id) => (id === 'reject' ? view.reject : (view.nodes.find((n) => n.id === id) || {}).t)).join(', then ')}.`);
    btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === current)));
    statusEl.innerHTML = sc.text;
  }

  btns.forEach((b) =>
    b.addEventListener('click', () => {
      current = Number(b.dataset.scn);
      render();
    }),
  );

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
