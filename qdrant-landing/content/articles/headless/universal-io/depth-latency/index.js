/*
 * depth-latency island: bandwidth against latency, one point per configuration,
 * with a chip toggle between random and sequential reads.
 *
 * Self-contained on purpose: Hugo bundles this file on its own, so it cannot
 * import a sibling module. generate.mjs imports THIS file to write the static
 * fallback, which keeps the island and the fallback from drifting.
 *
 * x = p50 time from submitting a read to its completion, which is what the
 *     caller waits. Past a backend's pipeline depth it includes queueing.
 * y = MB/s delivered by that configuration.
 *
 * Sequential p50 falls below the axis floor because readahead has already
 * fetched the page, so the read never touches the disk. Those points are
 * drawn hollow on the floor rather than silently moved.
 */
const XMIN = 0.1, XMAX = 120, YMIN = 0.1, YMAX = 600;
const XT = [0.1, 1, 10, 100];
const YT = [0.1, 1, 10, 100];

export const SETS = {
  rand: {
    label: 'Random',
    title: 'MB/s delivered, 4 KiB random reads (log scale)',
    series: [
      { name: 'mmap', hue: 'cyan', points: [
        { label: 'batch 1', ms: 0.5524, mb: 7.22 }, { label: 'batch 16', ms: 4.836, mb: 7.15 },
        { label: 'batch 64', ms: 18.4614, mb: 7.21 }, { label: 'batch 256', ms: 71.2242, mb: 7.22 }] },
      { name: 'io_uring', hue: 'blue', points: [
        { label: 'batch 1', ms: 0.5616, mb: 7.15 }, { label: 'batch 2', ms: 0.565, mb: 13.43 },
        { label: 'batch 4', ms: 0.572, mb: 25.84 }, { label: 'batch 8', ms: 0.5784, mb: 45.71 },
        { label: 'batch 16', ms: 0.6135, mb: 85.66 }, { label: 'batch 32', ms: 0.9287, mb: 94.34 },
        { label: 'batch 64', ms: 1.432, mb: 97.32 }, { label: 'batch 128', ms: 2.5331, mb: 105.29 },
        { label: 'batch 256', ms: 4.8724, mb: 107.67 }, { label: 'batch 512', ms: 9.4183, mb: 110.91 }] },
      { name: 'S3, same region', hue: 'red', points: [
        { label: '1 reader', ms: 23.94, mb: 0.167 }, { label: '2 readers', ms: 23.08, mb: 0.329 },
        { label: '4 readers', ms: 24.82, mb: 0.564 }, { label: '8 readers', ms: 23.98, mb: 1.029 },
        { label: '16 readers', ms: 23.95, mb: 1.886 }, { label: '32 readers', ms: 23.11, mb: 4.721 },
        { label: '64 readers', ms: 23.23, mb: 9.398 }, { label: '128 readers', ms: 24.06, mb: 11.323 }] },
    ],
    notes: [
      { ms: 0.75, mb: 33, hue: 'blue', lines: ['depth doubles bandwidth'] },
      { ms: 18, mb: 3.2, anchor: 'end', hue: 'cyan', lines: ['no pipeline, so batching only queues'] },
      { ms: 30, mb: 0.6, hue: 'red', lines: ['latency flat at 24 ms'] },
    ],
    mobileNotes: [
      { ms: 0.9, mb: 33, hue: 'blue', lines: ['depth doubles', 'bandwidth'] },
      { ms: 30, mb: 0.6, hue: 'red', lines: ['flat at 24 ms'] },
    ],
  },
  seq: {
    label: 'Sequential',
    title: 'MB/s delivered, 4 KiB sequential reads, each run on untouched bytes (log scale)',
    series: [
      { name: 'mmap', hue: 'cyan', points: [
        { label: 'batch 1', ms: 0.0001, mb: 115.13 }, { label: 'batch 16', ms: 0.8671, mb: 117.43 },
        { label: 'batch 256', ms: 5.0196, mb: 119.48 }] },
      { name: 'io_uring', hue: 'blue', points: [
        { label: 'batch 1', ms: 0.0015, mb: 221.69 }, { label: 'batch 256', ms: 2.5136, mb: 208.23 }] },
      { name: 'S3, same region', hue: 'red', points: [
        { label: '1 reader', ms: 22.82, mb: 0.181 }, { label: '2 readers', ms: 23.08, mb: 0.350 },
        { label: '4 readers', ms: 23.55, mb: 0.626 }, { label: '8 readers', ms: 23.54, mb: 1.123 },
        { label: '16 readers', ms: 23.93, mb: 1.795 }, { label: '32 readers', ms: 23.46, mb: 4.668 },
        { label: '64 readers', ms: 23.75, mb: 8.912 }, { label: '128 readers', ms: 24.00, mb: 7.773 }] },
    ],
    notes: [
      { ms: 0.13, mb: 38, hue: 'cyan', lines: ['mmap 117 MB/s, 16&#215; its random rate'] },
      { ms: 0.13, mb: 430, hue: 'blue', lines: ['io_uring 215 MB/s: bulk reads beat page faults'] },
      { ms: 110, mb: 3.4, anchor: 'end', hue: 'red', lines: ['S3 unchanged: the network does not read ahead'] },
      { ms: 100, mb: 0.4, anchor: 'end', lines: ['hollow: p50 under 0.1 ms: the page was already there'] },
    ],
    mobileNotes: [
      { ms: 0.13, mb: 40, hue: 'cyan', lines: ['mmap 117 MB/s,', 'io_uring 215'] },
      { ms: 100, mb: 0.19, anchor: 'end', lines: ['hollow: p50', 'under 0.1 ms'] },
    ],
  },
};

export const LABEL = {
  rand: 'Bandwidth against latency for three read backends on log scales, random reads. io_uring '
    + 'climbs almost straight up, from 7.15 to 85.66 megabytes per second while latency stays near '
    + '0.6 milliseconds, then bends right as the last 29 percent of bandwidth costs fifteen times '
    + 'the wait. mmap runs flat at about 7.2 megabytes per second whatever the batch, because its '
    + 'pipeline is one deep. S3 climbs straight up at about 24 milliseconds, from 0.17 to 11.3 '
    + 'megabytes per second as the number of readers rises from 1 to 128.',
  seq: 'The same axes for sequential reads, each run on bytes no earlier run touched. mmap holds about '
    + '117 megabytes per second whatever the batch, sixteen times its random rate, and io_uring reaches '
    + 'about 215. Most reads have a median latency below the axis floor because readahead had already '
    + 'fetched the page. The S3 line lands on top of its random one at every number of readers, '
    + 'because object storage does not read ahead.',
};

const GEO = {
  d: { w: 760, h: 372, L: 54, R: 740, T: 42, B: 246, legendY: 325, legendGap: 250 },
  m: { w: 480, h: 420, L: 46, R: 466, T: 42, B: 250, legendY: 310, legendStep: 28 },
};

export function drawing(setKey, variant) {
  const set = SETS[setKey];
  const g = GEO[variant];
  const { L, R, T, B } = g;
  const x = ms => L + (Math.log10(Math.max(ms, XMIN)) - Math.log10(XMIN)) / (Math.log10(XMAX) - Math.log10(XMIN)) * (R - L);
  const y = mb => B - (Math.log10(mb) - Math.log10(YMIN)) / (Math.log10(YMAX) - Math.log10(YMIN)) * (B - T);
  let s = '';
  s += `<text class="dl-title" x="${L}" y="20">${set.title}</text>`;
  for (const t of XT) {
    s += `<line class="dl-grid" x1="${x(t).toFixed(1)}" y1="${T}" x2="${x(t).toFixed(1)}" y2="${B}"/>`;
    s += `<text class="dl-tick" x="${x(t).toFixed(1)}" y="${B + 21}" text-anchor="middle">${t}</text>`;
  }
  for (const t of YT) {
    s += `<line class="dl-grid" x1="${L}" y1="${y(t).toFixed(1)}" x2="${R}" y2="${y(t).toFixed(1)}"/>`;
    s += `<text class="dl-tick" x="${L - 10}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${t}</text>`;
  }
  s += `<path class="dl-axis" d="M${L} ${T}V${B}H${R}"/>`;
  if (setKey === 'seq') {
    for (const ser of SETS.rand.series) {
      const d = ser.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.ms).toFixed(1)},${y(p.mb).toFixed(1)}`).join(' ');
      s += `<g class="dl-series dl-ghost dl-${ser.hue}" aria-hidden="true"><path class="dl-line" d="${d}"/></g>`;
    }
  }
  s += `<text class="dl-axlbl" x="${((L + R) / 2).toFixed(0)}" y="${B + 46}" text-anchor="middle">time from submit to completion, p50, in ms (log scale)</text>`;
  for (const ser of set.series) {
    const d = ser.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.ms).toFixed(1)},${y(p.mb).toFixed(1)}`).join(' ');
    s += `<g class="dl-series dl-${ser.hue}"><path class="dl-outline" d="${d}"/><path class="dl-line" d="${d}"/>`;
    for (const p of ser.points) {
      const off = p.ms < XMIN;
      s += `<circle class="dl-dot${off ? ' dl-dot--off' : ''}" cx="${x(p.ms).toFixed(1)}" cy="${y(p.mb).toFixed(1)}" r="3.5"/>`;
      s += `<circle class="dl-hit" cx="${x(p.ms).toFixed(1)}" cy="${y(p.mb).toFixed(1)}" r="10" tabindex="0" role="button"`
        + ` aria-label="${ser.name}, ${p.label}, ${p.mb} MB/s at ${off ? 'under 0.1' : p.ms} ms">`
        + `<title>${ser.name} ${p.label}: ${p.mb} MB/s at ${off ? '&lt;0.1' : p.ms} ms</title></circle>`;
    }
    s += '</g>';
  }
  for (const n of (variant === 'm' ? set.mobileNotes : set.notes)) {
    const cls = n.hue ? `dl-callout dl-${n.hue}` : 'dl-callout';
    n.lines.forEach((line, i) => {
      s += `<text class="${cls}${i ? ' dl-callout--cont' : ''}" x="${x(n.ms).toFixed(1)}" y="${(y(n.mb) + i * 17).toFixed(1)}"`
        + `${n.anchor ? ` text-anchor="${n.anchor}"` : ''}>${line}</text>`;
    });
  }
  set.series.forEach((ser, i) => {
    const lx = variant === 'm' ? L - 20 : L + i * g.legendGap;
    const ly = variant === 'm' ? g.legendY + i * g.legendStep : g.legendY;
    s += `<g class="dl-series dl-${ser.hue}">`
      + `<line class="dl-outline" x1="${lx}" y1="${ly - 5}" x2="${lx + 26}" y2="${ly - 5}"/>`
      + `<line class="dl-line" x1="${lx}" y1="${ly - 5}" x2="${lx + 26}" y2="${ly - 5}"/>`
      + `</g><text class="dl-legend" x="${lx + 34}" y="${ly}">${ser.name}</text>`;
  });
  return s;
}

export function svg(setKey, variant) {
  const g = GEO[variant];
  return `<svg class="qi-svg qi-dl__${variant}" viewBox="0 0 ${g.w} ${g.h}" role="img" aria-label="${LABEL[setKey]}">${drawing(setKey, variant)}</svg>`;
}

export const body = variant => drawing('rand', variant);

export function mount(node) {
  node.classList.add('qi-dl');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Read pattern">',
    Object.entries(SETS).map(([k, v]) =>
      `<button type="button" class="qi-chip qi-dl__btn" data-mode="${k}" aria-pressed="${k === 'rand'}">${v.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    svg('rand', 'd'),
    svg('rand', 'm'),
    '</div>',
  ].join('');

  const btns = [...node.querySelectorAll('.qi-dl__btn')];
  const figures = { d: node.querySelector('.qi-dl__d'), m: node.querySelector('.qi-dl__m') };
  const setMode = (key) => {
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === key)));
    for (const v of ['d', 'm']) {
      figures[v].innerHTML = drawing(key, v);
      figures[v].setAttribute('aria-label', LABEL[key]);
    }
  };
  btns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
