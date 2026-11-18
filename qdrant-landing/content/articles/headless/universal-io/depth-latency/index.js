/*
 * depth-frontier island: bandwidth against latency, with the Pareto frontier.
 *
 * Upper left is better: more MB/s for less wait. The shaded wedge and the step
 * line mark the frontier, the configurations nothing else beats on both axes.
 * One chip group swaps the read pattern.
 *
 * Self-contained on purpose: Hugo bundles this file on its own.
 */
const NS = 'http://www.w3.org/2000/svg';

export const SETS = {
  rand: {
    label: 'Random',
    title: 'MB/s delivered against the wait, 4 KiB random reads. Up and left is better',
    series: [
      { name: 'mmap', hue: 1, nameAt: 1, namePlace: 'down', points: [
        { label: '', ms: 0.5524, mb: 7.22 },
        { label: '', ms: 4.836, mb: 7.15 },
        { label: '', ms: 18.4614, mb: 7.21 },
        { label: 'batch 256', ms: 71.2242, mb: 7.22, place: 'up' }] },
      { name: 'io_uring', hue: 2, nameAt: 5, namePlace: 'up', points: [
        { label: 'batch 1', ms: 0.5616, mb: 7.15, place: 'left' },
        { label: '', ms: 0.572, mb: 25.84 },
        { label: 'batch 16', ms: 0.6135, mb: 85.66, place: 'up' },
        { label: '', ms: 1.432, mb: 97.32 },
        { label: '', ms: 4.8724, mb: 107.67 },
        { label: 'batch 512', ms: 9.4183, mb: 110.91, place: 'down' }] },
      { name: 'S3', hue: 3, nameAt: 2, namePlace: 'right', points: [
        { label: '1 reader', ms: 23.94, mb: 0.167, place: 'left' },
        { label: '', ms: 23.98, mb: 1.029 },
        { label: '', ms: 23.11, mb: 4.721 },
        { label: '128 readers', ms: 24.06, mb: 11.323, place: 'up' }] },
    ],
    note: 'Every frontier point is <code>io_uring</code>. Batch 16 delivers 12&#215; the bandwidth of batch 1 for 9% more wait. <code>mmap</code> cannot join: its pipeline is one deep, so a bigger batch only queues. S3 sits 43&#215; further right, because each read crosses the network.',
  },
  seq: {
    label: 'Sequential',
    title: 'The same axes, 4 KiB sequential reads on untouched bytes',
    series: [
      { name: 'mmap', hue: 1, nameAt: 0, namePlace: 'down', points: [
        { label: '', ms: 0.08, mb: 115.13, stub: true },
        { label: '', ms: 0.8671, mb: 117.43 },
        { label: 'batch 256', ms: 5.0196, mb: 119.48, place: 'down' }] },
      { name: 'io_uring', hue: 2, nameAt: 0, namePlace: 'up', points: [
        { label: '', ms: 0.08, mb: 221.69, stub: true },
        { label: 'batch 256', ms: 2.5136, mb: 208.23, place: 'up' }] },
      { name: 'S3', hue: 3, nameAt: 2, namePlace: 'right', points: [
        { label: '1 reader', ms: 22.82, mb: 0.181, place: 'left' },
        { label: '', ms: 23.54, mb: 1.123 },
        { label: '', ms: 23.46, mb: 4.668 },
        { label: '128 readers', ms: 24.0, mb: 7.773, place: 'up' }] },
    ],
    note: 'Read in order and the kernel reads ahead, so the frontier jumps to the top left and depth stops mattering. <code>mmap</code> holds about 117 MB/s at every batch, 16&#215; its random rate, and <code>io_uring</code> reaches 221. S3 does not move: nothing reads ahead across network requests.',
  },
};

export const LABEL = {
  rand: 'Bandwidth against latency for three read backends on log scales, random reads. Up and left '
    + 'is better. The frontier is made entirely of io_uring points, which climb from 7.15 MB/s at '
    + 'batch 1 to 85.66 at batch 16 while the wait stays near 0.6 ms. mmap runs flat at about 7.2 MB/s '
    + 'whatever the batch, moving only to the right. S3 sits near 24 ms, climbing from 0.17 MB/s with '
    + 'one reader to 11.3 with 128.',
  seq: 'The same axes for sequential reads. mmap holds about 117 MB/s at every batch and io_uring '
    + 'reaches 221, both at the top left, because the kernel reads ahead. S3 is unchanged from random, '
    + 'climbing from 0.18 to 7.8 MB/s at about 23 ms.',
};

const VB = { w: 560, h: 330 };
const PLOT = { x: 48, y: 38, w: 448, h: 214 };
const XD = [0.06, 140], YD = [0.1, 480];
const XT = [0.1, 1, 10, 100], YT = [1, 10, 100];
const R = 5.5;

const lg = Math.log10;
const fx = (v) => PLOT.x + ((lg(v) - lg(XD[0])) / (lg(XD[1]) - lg(XD[0]))) * PLOT.w;
const fy = (v) => PLOT.y + PLOT.h - ((lg(v) - lg(YD[0])) / (lg(YD[1]) - lg(YD[0]))) * PLOT.h;

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

/* Points nothing else beats on both axes: no other point is faster AND wider. */
function frontier(set) {
  const all = [];
  set.series.forEach((s) => s.points.forEach((p) => all.push({ ...p, hue: s.hue, name: s.name })));
  const keep = all.filter((p) => !all.some((q) => q !== p && q.ms <= p.ms && q.mb >= p.mb && (q.ms < p.ms || q.mb > p.mb)));
  return keep.sort((a, b) => a.ms - b.ms);
}

export function mount(node) {
  node.classList.add('qi-pf');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Read pattern">',
    ['rand', 'seq'].map((k, i) => `<button type="button" class="qi-chip qi-pf__p" data-p="${k}" aria-pressed="${i === 0}">${SETS[k].label}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-pf__svg" viewBox="0 0 ${VB.w} ${VB.h}" role="img" aria-label="${LABEL.rand}"></svg>`,
    '  <p class="qi-status qi-pf__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-pf__svg');
  const statusEl = node.querySelector('.qi-pf__status');
  let pattern = 'rand';

  const title = el('text', { class: 'qi-label qi-label--strong', x: 0, y: 14 }, svg);

  // Grid and axes, fixed across views.
  YT.forEach((t) => {
    el('line', { class: 'qi-pf__grid', x1: PLOT.x, x2: PLOT.x + PLOT.w, y1: fy(t), y2: fy(t) }, svg);
    el('text', { class: 'qi-label', x: PLOT.x - 8, y: fy(t) + 4, 'text-anchor': 'end' }, svg, String(t));
  });
  XT.forEach((t) => {
    el('line', { class: 'qi-pf__grid', x1: fx(t), x2: fx(t), y1: PLOT.y, y2: PLOT.y + PLOT.h }, svg);
    el('text', { class: 'qi-label', x: fx(t), y: PLOT.y + PLOT.h + 18, 'text-anchor': 'middle' }, svg, String(t));
  });
  el('line', { class: 'qi-axis', x1: PLOT.x, x2: PLOT.x + PLOT.w, y1: PLOT.y + PLOT.h, y2: PLOT.y + PLOT.h }, svg);
  el('text', { class: 'qi-label', x: PLOT.x + PLOT.w / 2, y: PLOT.y + PLOT.h + 40, 'text-anchor': 'middle' }, svg,
    'wait per read, p50 in ms (log scale)');

  const front = el('g', { class: 'qi-pf__front' }, svg);
  const lines = el('g', { class: 'qi-pf__lines' }, svg);
  const dots = el('g', { class: 'qi-pf__dots' }, svg);

  function render() {
    const set = SETS[pattern];
    title.textContent = set.title;
    svg.setAttribute('aria-label', LABEL[pattern]);
    front.replaceChildren(); lines.replaceChildren(); dots.replaceChildren();

    // The frontier wedge: a staircase from the top left down to the fastest point.
    const f = frontier(set);
    if (f.length) {
      const steps = [];
      f.forEach((p, i) => { if (i) steps.push(`L${fx(p.ms)},${fy(f[i - 1].mb)}`); steps.push(`${i ? 'L' : 'M'}${fx(p.ms)},${fy(p.mb)}`); });
      el('path', { class: 'qi-pf__step', d: steps.join(' ') }, front);
      const mid = f[f.length > 2 ? 1 : 0];
      const right = f.length < 2 || fx(mid.ms) < PLOT.x + 120;
      el('text', {
        class: 'qi-pf__tag',
        x: fx(mid.ms) + (right ? 14 : -12),
        y: fy(mid.mb) + 4,
        'text-anchor': right ? 'start' : 'end',
      }, front, f.length < 2 ? 'frontier: one point' : 'frontier');
    }

    set.series.forEach((s) => {
      const pts = s.points;
      el('polyline', { class: `qi-pf__line qi-pf__h${s.hue}`, points: pts.map((p) => `${fx(p.ms)},${fy(p.mb)}`).join(' ') }, lines);
      const anchor = pts[Math.min(s.nameAt ?? pts.length - 1, pts.length - 1)];
      const np = s.namePlace || 'up';
      el('text', {
        class: `qi-pf__series qi-pf__h${s.hue}`,
        x: fx(anchor.ms) + (np === 'right' ? 12 : np === 'left' ? -12 : 0),
        y: fy(anchor.mb) + (np === 'up' ? -14 : np === 'down' ? 24 : 5),
        'text-anchor': np === 'right' ? 'start' : np === 'left' ? 'end' : 'middle',
      }, dots, s.name);
      pts.forEach((p) => {
        const g = el('g', { class: `qi-pf__pt qi-pf__h${s.hue}`, transform: `translate(${fx(p.ms)},${fy(p.mb)})` }, dots);
        el('title', {}, g, `${s.name} ${p.label || ''} ${p.mb} MB/s, ${p.ms} ms`);
        el('circle', { class: p.stub ? 'is-stub' : '', r: p.label ? R : R - 1.8 }, g);
        if (p.label) {
          const at = p.place;
          el('text', {
            class: 'qi-pf__name',
            x: at === 'left' ? -(R + 6) : at === 'right' ? R + 6 : 0,
            y: at === 'up' ? -(R + 7) : at === 'down' ? R + 16 : 4,
            'text-anchor': at === 'left' ? 'end' : at === 'right' ? 'start' : 'middle',
          }, g, p.label);
        }
      });
    });

    statusEl.innerHTML = set.note;
    node.querySelectorAll('.qi-pf__p').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === pattern)));
  }

  node.addEventListener('click', (e) => {
    const b = e.target.closest('.qi-pf__p');
    if (b) { pattern = b.dataset.p; render(); }
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
