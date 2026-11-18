/*
 * depth-latency island: what a deeper pipeline buys each backend.
 *
 * Six bars: three backends, each at its shallowest and its deepest measured
 * setting. One chip group swaps the measure (bandwidth or latency) so the bars
 * stay in place and only their lengths change; a second swaps the read pattern.
 *
 * Self-contained on purpose: Hugo bundles this file on its own.
 */
const NS = 'http://www.w3.org/2000/svg';

export const SETS = {
  rand: {
    label: 'Random',
    rows: [
      { name: 'mmap', depth: 'batch 1', hue: 1, deep: false, mb: 7.22, ms: 0.55 },
      { name: 'mmap', depth: 'batch 256', hue: 1, deep: true, mb: 7.22, ms: 71.22 },
      { name: 'io_uring', depth: 'batch 1', hue: 2, deep: false, mb: 7.15, ms: 0.56 },
      { name: 'io_uring', depth: 'batch 16', hue: 2, deep: true, mb: 85.66, ms: 0.61 },
      { name: 'S3', depth: '1 reader', hue: 3, deep: false, mb: 0.17, ms: 23.94 },
      { name: 'S3', depth: '128 readers', hue: 3, deep: true, mb: 11.32, ms: 24.06 },
    ],
    note: {
      mb: 'Depth pays off only where reads can overlap. <code>io_uring</code> turns batch 16 into 12&#215; the bandwidth of batch 1. <code>mmap</code> is one deep, so a batch only queues. Each S3 reader adds its own round trip.',
      ms: '<code>mmap</code> batch 256 waits 71 ms for the same 7.2 MB/s, because the batch becomes a queue. <code>io_uring</code> holds 0.6 ms while its bandwidth grows. S3 sits at 24 ms however many readers run.',
    },
  },
  seq: {
    label: 'Sequential',
    rows: [
      { name: 'mmap', depth: 'batch 1', hue: 1, deep: false, mb: 115.13, ms: 0.0001 },
      { name: 'mmap', depth: 'batch 256', hue: 1, deep: true, mb: 119.48, ms: 5.02 },
      { name: 'io_uring', depth: 'batch 1', hue: 2, deep: false, mb: 221.69, ms: 0.0015 },
      { name: 'io_uring', depth: 'batch 256', hue: 2, deep: true, mb: 208.23, ms: 2.51 },
      { name: 'S3', depth: '1 reader', hue: 3, deep: false, mb: 0.18, ms: 22.82 },
      { name: 'S3', depth: '128 readers', hue: 3, deep: true, mb: 7.77, ms: 24.0 },
    ],
    note: {
      mb: 'Read in order and the kernel reads ahead, so depth stops mattering on local storage. <code>mmap</code> holds about 117 MB/s at every batch, 16&#215; its random rate. Object storage gains nothing, because nothing reads ahead across network requests.',
      ms: 'Most local reads never touch the disk, so their median falls under 0.1 ms and the bar is a stub. S3 still pays 23 ms for every request, in order or not.',
    },
  },
};

const MEASURES = {
  mb: { key: 'mb', chip: 'Bandwidth', title: 'MB/s delivered, 4 KiB reads' },
  ms: { key: 'ms', chip: 'Latency', title: 'p50 time from submitting a read to its completion, in ms' },
};

const VB = { w: 520, h: 232 };
const LABEL_W = 150;
const BAR_X = LABEL_W + 12;
const BAR_MAX = 248;
const BAR_H = 16;
const ROW_Y = [36, 64, 100, 128, 164, 192];

export const LABEL = {
  rand: 'Bar chart of three read backends at their shallowest and deepest setting, random reads. '
    + 'io_uring goes from 7.15 MB/s at batch 1 to 85.66 at batch 16 while latency stays near 0.6 ms. '
    + 'mmap delivers 7.2 MB/s at both batch 1 and batch 256, but latency rises from 0.55 ms to 71 ms. '
    + 'S3 goes from 0.17 MB/s with one reader to 11.32 with 128, at about 24 ms throughout.',
  seq: 'The same six bars for sequential reads. mmap holds about 117 MB/s at every batch and io_uring '
    + 'about 210, because the kernel reads ahead. S3 is unchanged from random, at 0.18 MB/s with one '
    + 'reader and 7.77 with 128, still about 23 ms per request.',
};

const fmt = (v, key) => {
  if (key === 'ms') return v < 0.1 ? '< 0.1 ms' : v < 10 ? `${v.toFixed(2)} ms` : `${v.toFixed(1)} ms`;
  return v < 1 ? `${v.toFixed(2)} MB/s` : `${v.toFixed(2).replace(/\.00$/, '')} MB/s`;
};

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

export function mount(node) {
  node.classList.add('qi-dl');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group" role="group" aria-label="Measure">',
    Object.values(MEASURES).map((m, i) =>
      `<button type="button" class="qi-chip qi-dl__m" data-m="${m === MEASURES.mb ? 'mb' : 'ms'}" aria-pressed="${i === 0}">${m.chip}</button>`).join(''),
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Read pattern">',
    ['rand', 'seq'].map((k, i) =>
      `<button type="button" class="qi-chip qi-dl__p" data-p="${k}" aria-pressed="${i === 0}">${SETS[k].label}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-dl__svg" viewBox="0 0 ${VB.w} ${VB.h}" role="img" aria-label="${LABEL.rand}"></svg>`,
    '  <p class="qi-status qi-dl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-dl__svg');
  const statusEl = node.querySelector('.qi-dl__status');
  let pattern = 'rand';
  let measure = 'mb';

  const title = el('text', { class: 'qi-label qi-label--strong', x: 0, y: 14 }, svg);
  const bars = ROW_Y.map((y) => {
    const g = el('g', { class: 'qi-dl__row' }, svg);
    const name = el('text', { class: 'qi-dl__name', x: LABEL_W, y: y + 12, 'text-anchor': 'end' }, g);
    const bar = el('rect', { class: 'qi-dl__bar', x: BAR_X, y, width: 0, height: BAR_H, rx: 3 }, g);
    const val = el('text', { class: 'qi-dl__val', y: y + 12 }, g);
    return { g, name, bar, val };
  });

  function render() {
    const set = SETS[pattern];
    const key = MEASURES[measure].key;
    const max = Math.max(...set.rows.map((r) => r[key]));
    title.textContent = MEASURES[measure].title;
    svg.setAttribute('aria-label', LABEL[pattern]);

    set.rows.forEach((r, i) => {
      const b = bars[i];
      const w = Math.max(2, (r[key] / max) * BAR_MAX);
      b.g.setAttribute('class', `qi-dl__row qi-dl__row--h${r.hue}${r.deep ? ' is-deep' : ''}`);
      b.name.textContent = `${r.name} · ${r.depth}`;
      b.bar.setAttribute('width', w);
      b.val.setAttribute('x', BAR_X + w + 8);
      b.val.textContent = fmt(r[key], key);
    });
    statusEl.innerHTML = set.note[measure];

    node.querySelectorAll('.qi-dl__m').forEach((el2) => el2.setAttribute('aria-pressed', String(el2.dataset.m === measure)));
    node.querySelectorAll('.qi-dl__p').forEach((el2) => el2.setAttribute('aria-pressed', String(el2.dataset.p === pattern)));
  }

  node.addEventListener('click', (e) => {
    const m = e.target.closest('.qi-dl__m');
    const p = e.target.closest('.qi-dl__p');
    if (m) { measure = m.dataset.m; render(); }
    if (p) { pattern = p.dataset.p; render(); }
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
