/*
 * depth-latency island: a static, theme-aware scatter for the Universal I/O
 * article. No controls. It is an island so the drawing follows the page theme
 * through the shared --qi-* tokens; index.css maps the series colours for
 * light and dark and swaps in the stacked composition below 640px.
 *
 * Self-contained on purpose: Hugo bundles this file on its own, so it cannot
 * import a sibling module. generate.mjs imports THIS file to write the static
 * fallback, which keeps the island and the fallback from drifting.
 *
 * x = p50 time from submitting a read to its completion, which is what the
 *     caller waits. Past a backend's pipeline depth it includes queueing.
 * y = MB/s delivered by that configuration.
 */
export const SERIES = [
  {
    key: 'mmap', name: 'mmap', hue: 'cyan',
    points: [
      { label: 'batch 1', ms: 0.5524, mb: 7.22 },
      { label: 'batch 16', ms: 4.836, mb: 7.15 },
      { label: 'batch 64', ms: 18.4614, mb: 7.21 },
      { label: 'batch 256', ms: 71.2242, mb: 7.22 },
    ],
  },
  {
    key: 'uring', name: 'io_uring', hue: 'blue',
    points: [
      { label: 'batch 1', ms: 0.5616, mb: 7.15 },
      { label: 'batch 2', ms: 0.565, mb: 13.43 },
      { label: 'batch 4', ms: 0.572, mb: 25.84 },
      { label: 'batch 8', ms: 0.5784, mb: 45.71 },
      { label: 'batch 16', ms: 0.6135, mb: 85.66 },
      { label: 'batch 32', ms: 0.9287, mb: 94.34 },
      { label: 'batch 64', ms: 1.432, mb: 97.32 },
      { label: 'batch 128', ms: 2.5331, mb: 105.29 },
      { label: 'batch 256', ms: 4.8724, mb: 107.67 },
      { label: 'batch 512', ms: 9.4183, mb: 110.91 },
    ],
  },
  {
    key: 's3', name: 'S3, same region', hue: 'red',
    points: [
      { label: '1 in flight', ms: 24.32, mb: 0.149 },
      { label: '2 in flight', ms: 24.28, mb: 0.267 },
      { label: '4 in flight', ms: 25.33, mb: 0.565 },
      { label: '8 in flight', ms: 23.79, mb: 0.895 },
      { label: '16 in flight', ms: 24.16, mb: 2.248 },
      { label: '32 in flight', ms: 23.99, mb: 3.346 },
      { label: '128 in flight', ms: 25.1, mb: 12.55 },
    ],
  },
];

export const LABEL =
  'Bandwidth against latency for three read backends, log-log. io_uring climbs almost '
  + 'straight up, from 7.15 to 85.66 megabytes per second while latency stays near 0.6 '
  + 'milliseconds, then bends right: the last 29 percent of bandwidth costs 15 times the wait. '
  + 'mmap runs flat along the bottom at about 7.2 megabytes per second whatever the batch, '
  + 'because its pipeline is one deep, so a batch of 256 only adds queueing and 129 times the '
  + 'wait. S3 climbs straight up at about 24 milliseconds, from 0.15 to 12.55 megabytes per '
  + 'second, because its latency barely moves as concurrency rises.';

const XMIN = 0.4, XMAX = 120, YMIN = 0.1, YMAX = 220;
const XT = [0.5, 1, 2, 5, 10, 20, 50, 100];
const YT = [0.1, 1, 10, 100];

export function drawing(opts) {
  const { w, h, L, R, T, B, titleSize, notes } = opts;
  const x = ms => L + (Math.log10(ms) - Math.log10(XMIN)) / (Math.log10(XMAX) - Math.log10(XMIN)) * (R - L);
  const y = mb => B - (Math.log10(mb) - Math.log10(YMIN)) / (Math.log10(YMAX) - Math.log10(YMIN)) * (B - T);
  let s = '';
  s += `<text class="dl-title" x="${L}" y="${T - 52}" style="font-size:${titleSize}px">Depth buys bandwidth. Over-batching buys only waiting.</text>`;
  s += `<text class="dl-note" x="${L}" y="${T - 22}">4 KiB random reads, cold, one box</text>`;
  for (const t of XT) {
    s += `<line class="dl-grid" x1="${x(t).toFixed(1)}" y1="${T}" x2="${x(t).toFixed(1)}" y2="${B}"/>`;
    s += `<text class="dl-tick" x="${x(t).toFixed(1)}" y="${B + 22}" text-anchor="middle">${t} ms</text>`;
  }
  for (const t of YT) {
    s += `<line class="dl-grid" x1="${L}" y1="${y(t).toFixed(1)}" x2="${R}" y2="${y(t).toFixed(1)}"/>`;
    s += `<text class="dl-tick" x="${L - 10}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${t}</text>`;
  }
  s += `<path class="dl-axis" d="M${L} ${T}V${B}H${R}"/>`;
  s += `<text class="dl-note" x="${((L + R) / 2).toFixed(0)}" y="${B + 48}" text-anchor="middle">time from submit to completion, p50 &#8594;</text>`;
  s += `<text class="dl-note" transform="translate(${L - 52} ${((T + B) / 2).toFixed(0)}) rotate(-90)" text-anchor="middle">MB/s delivered &#8594;</text>`;
  for (const ser of SERIES) {
    const d = ser.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.ms).toFixed(1)},${y(p.mb).toFixed(1)}`).join(' ');
    s += `<g class="dl-series dl-${ser.hue}">`;
    s += `<path class="dl-outline" d="${d}"/><path class="dl-line" d="${d}"/>`;
    for (const p of ser.points) {
      s += `<circle class="dl-dot" cx="${x(p.ms).toFixed(1)}" cy="${y(p.mb).toFixed(1)}" r="4.5"/>`;
      s += `<circle class="dl-hit" cx="${x(p.ms).toFixed(1)}" cy="${y(p.mb).toFixed(1)}" r="12" tabindex="0" role="button"`
        + ` aria-label="${ser.name}, ${p.label}, ${p.mb} MB/s at ${p.ms} ms">`
        + `<title>${ser.name} ${p.label}: ${p.mb} MB/s at ${p.ms} ms</title></circle>`;
    }
    s += '</g>';
  }
  for (const n of notes) {
    const cls = n.hue ? `dl-callout dl-${n.hue}` : 'dl-callout';
    n.lines.forEach((line, i) => {
      s += `<text class="${cls}${i ? ' dl-callout--cont' : ''}" x="${x(n.ms).toFixed(1)}" y="${(y(n.mb) + i * 17).toFixed(1)}"`
        + `${n.anchor ? ` text-anchor="${n.anchor}"` : ''}>${line}</text>`;
    });
  }
  return s;
}

export const LEGEND = (x0, y0, gap) => SERIES.map((ser, i) => {
  const lx = x0 + i * gap, ly = y0;
  return `<g class="dl-series dl-${ser.hue}">`
    + `<line class="dl-outline" x1="${lx}" y1="${ly - 5}" x2="${lx + 26}" y2="${ly - 5}"/>`
    + `<line class="dl-line" x1="${lx}" y1="${ly - 5}" x2="${lx + 26}" y2="${ly - 5}"/>`
    + `</g><text class="dl-legend" x="${lx + 34}" y="${ly}">${ser.name}</text>`;
}).join('');

const DESKTOP = {
  w: 960, h: 560, L: 150, R: 900, T: 150, B: 440, titleSize: 22,
  notes: [
    { ms: 0.63, mb: 30, hue: 'blue', lines: ['each doubling of depth doubles bandwidth'] },
    { ms: 100, mb: 180, anchor: 'end', lines: ['ring full at 16: +29% bandwidth, 15&#215; the wait'] },
    { ms: 2.2, mb: 3.6, hue: 'cyan', lines: ['no pipeline, so batching only queues'] },
    { ms: 21, mb: 0.3, hue: 'red', anchor: 'end', lines: ['latency flat at 24 ms'] },
  ],
};

const MOBILE = {
  w: 480, h: 610, L: 96, R: 452, T: 158, B: 416, titleSize: 17,
  notes: [
    { ms: 0.75, mb: 40, hue: 'blue', lines: ['depth doubles', 'bandwidth'] },
    { ms: 22, mb: 0.25, hue: 'red', anchor: 'end', lines: ['latency flat', 'at 24 ms'] },
  ],
};

const stackedLegend = (x0, y0, step) => SERIES.map((ser, i) => {
  const ly = y0 + i * step;
  return `<g class="dl-series dl-${ser.hue}">`
    + `<line class="dl-outline" x1="${x0}" y1="${ly - 5}" x2="${x0 + 26}" y2="${ly - 5}"/>`
    + `<line class="dl-line" x1="${x0}" y1="${ly - 5}" x2="${x0 + 26}" y2="${ly - 5}"/>`
    + `</g><text class="dl-legend" x="${x0 + 34}" y="${ly}">${ser.name}</text>`;
}).join('');

export function body(variant) {
  const o = variant === 'm' ? MOBILE : DESKTOP;
  const legend = variant === 'm'
    ? stackedLegend(o.L - 20, 500, 30)
    : LEGEND(o.L, 526, 250);
  return drawing(o) + legend;
}

export function svg(variant) {
  const o = variant === 'm' ? MOBILE : DESKTOP;
  return `<svg class="qi-svg qi-dl__${variant}" viewBox="0 0 ${o.w} ${o.h}" role="img" aria-label="${LABEL}">${body(variant)}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-dl');
  node.innerHTML = svg('d') + svg('m');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
