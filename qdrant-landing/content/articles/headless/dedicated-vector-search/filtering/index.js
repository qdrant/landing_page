/*
 * filtering island: interactive replacement for filterable-vector-index.png.
 *
 * The same toy graph under three setups, searched from the same entry point
 * toward the same query:
 *   1 Default index:     the search walks to the nearest point.
 *   2 Introducing filters:  points that do not match the filter cannot be visited,
 *                        and the matching points near the query are not connected
 *                        to the entry point, so the walk gets stuck.
 *   3 Filterable index:  an additional link between matching points, added when
 *                        the index is built, connects them again.
 * Step through the three searches together. The graph is illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';
const NODES = [
  [110, 205], [60, 170], [150, 165], [80, 135], [170, 115],
  [50, 95], [125, 80], [190, 70], [80, 50], [140, 40],
];
const EDGES = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5], [5, 8], [8, 6], [4, 6], [6, 9], [6, 7], [4, 7], [8, 9], [7, 9]];
const QUERY = [120, 62];
const REGION_R = 40;
const FILTERED = new Set([2, 4, 7, 8]);
const EXTRA = [3, 6];
const PANELS = [
  { title: '1 Default vector index', filtered: false, extra: false, path: [0, 2, 4, 6] },
  { title: '2 Introducing filters', filtered: true, extra: false, path: [0, 1, 3, 5], stuck: 5 },
  { title: '3 Filterable vector index', filtered: true, extra: true, path: [0, 1, 3, 6] },
];
const STEPS = ['Start', 'Step 1', 'Step 2', 'Step 3'];
const STATUS = [
  'Every panel starts at the same entry point, the ringed point at the bottom. The green circle marks where the query vector\'s nearest neighbors are.',
  'Step 1: each search moves to a neighbor closer to the query. With a filter, only points that match it can be visited, so panels 2 and 3 take a different route.',
  'Step 2: the default search closes in on the query. The filtered searches stay on matching points, which lead away from the green circle.',
  'Step 3: the default index reaches the nearest point. With only a filter (panel 2) the search is stuck: the matching points near the query are not connected to it. In panel 3 the additional link jumps to them.',
];
const LEGEND = [
  { cls: 'is-match', text: 'matches the filter' },
  { cls: 'is-out', text: 'filtered out' },
  { cls: 'is-path', text: 'search path' },
  { cls: 'is-extra', text: 'additional link' },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('dv-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('dv-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

export function mount(node) {
  node.classList.add('dv-fi');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Search step">',
    STEPS.map((s, i) => `<button type="button" class="qi-chip" data-step="${i}" aria-pressed="false">${s}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 300" role="img" aria-label="The same graph searched three ways: with the default index, with a filter that strands the search, and with a filterable index whose additional link reaches the nearest matching point.">',
    '    <g class="dv-fi__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 dv-fi__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.dv-fi__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.dv-fi__status');
  const chips = [...node.querySelectorAll('[data-step]')];
  let step = 3;
  const isNarrow = watchNarrow(node, () => render());

  function line(cls, a, b, ox, oy, shorten = 0) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / L;
    const uy = (b[1] - a[1]) / L;
    return el('line', {
      class: cls,
      x1: ox + a[0] + ux * shorten,
      y1: oy + a[1] + uy * shorten,
      x2: ox + b[0] - ux * shorten,
      y2: oy + b[1] - uy * shorten,
    });
  }
  function head(ox, oy, a, b) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / L;
    const uy = (b[1] - a[1]) / L;
    const x = ox + b[0] - ux * 8;
    const y = oy + b[1] - uy * 8;
    return el('polygon', {
      class: 'dv-fi__head',
      points: `${x},${y} ${x - ux * 9 - uy * 4.5},${y - uy * 9 + ux * 4.5} ${x - ux * 9 + uy * 4.5},${y - uy * 9 - ux * 4.5}`,
    });
  }

  function drawPanel(p, ox, oy) {
    g.appendChild(el('rect', { class: 'qi-frame', x: ox, y: oy, width: 230, height: 250, rx: 8 }));
    g.appendChild(el('text', { class: 'qi-title', x: ox + 12, y: oy + 24 }, p.title));
    const gx = ox + 15;
    const gy = oy + 34;
    const out = (i) => p.filtered && FILTERED.has(i);
    g.appendChild(el('circle', { class: 'dv-fi__region', cx: gx + QUERY[0], cy: gy + QUERY[1], r: REGION_R }));
    EDGES.forEach(([a, b]) => {
      const faded = out(a) || out(b);
      g.appendChild(line(`dv-fi__edge${faded ? ' is-faded' : ''}`, NODES[a], NODES[b], gx, gy));
    });
    if (p.extra) {
      const [a, b] = EXTRA;
      const mx = (NODES[a][0] + NODES[b][0]) / 2 - 24;
      const my = (NODES[a][1] + NODES[b][1]) / 2;
      g.appendChild(el('path', { class: 'dv-fi__extra', d: `M${gx + NODES[a][0]} ${gy + NODES[a][1]} Q${gx + mx} ${gy + my} ${gx + NODES[b][0]} ${gy + NODES[b][1]}` }));
    }
    for (let i = 1; i <= step && i < p.path.length; i++) {
      const a = NODES[p.path[i - 1]];
      const b = NODES[p.path[i]];
      const viaExtra = p.extra && p.path[i - 1] === EXTRA[0] && p.path[i] === EXTRA[1];
      if (viaExtra) {
        g.appendChild(el('path', { class: 'dv-fi__path', d: `M${gx + a[0]} ${gy + a[1]} Q${gx + (a[0] + b[0]) / 2 - 24} ${gy + (a[1] + b[1]) / 2} ${gx + b[0]} ${gy + b[1]}` }));
      } else {
        g.appendChild(line('dv-fi__path', a, b, gx, gy, 8));
        g.appendChild(head(gx, gy, a, b));
      }
    }
    const reached = new Set(p.path.slice(0, step + 1));
    NODES.forEach((n, i) => {
      const cls = out(i) ? 'is-out' : 'is-match';
      const hit = i === 6 && reached.has(6);
      g.appendChild(el('circle', { class: `dv-fi__node ${cls}${hit ? ' is-hit' : ''}`, cx: gx + n[0], cy: gy + n[1], r: 7 }));
    });
    g.appendChild(el('circle', { class: 'dv-fi__entry', cx: gx + NODES[0][0], cy: gy + NODES[0][1], r: 12 }));
    g.appendChild(el('circle', { class: 'dv-fi__query', cx: gx + QUERY[0], cy: gy + QUERY[1], r: 5 }));
    if (p.stuck != null && step === 3) {
      const [x, y] = NODES[p.stuck];
      const cx = gx + x;
      const cy = gy + y;
      g.appendChild(el('path', { class: 'dv-fi__x', d: `M${cx - 10} ${cy - 10} L${cx + 10} ${cy + 10} M${cx + 10} ${cy - 10} L${cx - 10} ${cy + 10}` }));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: cx + 14, y: cy + 5 }, 'stuck'));
    }
  }

  function legend(W, y) {
    let x = 14;
    let row = 0;
    LEGEND.forEach((item) => {
      const w = 34 + item.text.length * 8.4;
      if (x + w > W - 8) {
        x = 14;
        row += 1;
      }
      const cy = y + row * 24;
      const cx = x + 8;
      if (item.cls === 'is-match' || item.cls === 'is-out') {
        g.appendChild(el('circle', { class: `dv-fi__node ${item.cls}`, cx, cy, r: 7 }));
      } else {
        g.appendChild(el('line', { class: item.cls === 'is-path' ? 'dv-fi__path' : 'dv-fi__extra', x1: cx - 8, y1: cy, x2: cx + 8, y2: cy }));
      }
      g.appendChild(el('text', { class: 'qi-label', x: x + 24, y: cy + 5 }, item.text));
      x += w;
    });
    return y + row * 24 + 14;
  }

  function render() {
    const narrow = isNarrow();
    g.replaceChildren();
    const W = narrow ? 340 : 760;
    PANELS.forEach((p, i) => {
      if (narrow) drawPanel(p, 55, 8 + i * 262);
      else drawPanel(p, 10 + i * 250, 8);
    });
    const bottom = narrow ? 8 + 3 * 262 + 14 : 8 + 250 + 22;
    const H = legend(W, bottom);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    statusEl.textContent = STATUS[step];
  }

  function setStep(i) {
    step = i;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === step)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setStep(Number(b.dataset.step))));

  setStep(3);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
