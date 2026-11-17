/*
 * depth-latency island: a static, theme-aware scatter for the Universal I/O
 * article. No controls. It is an island so the drawing follows the page theme
 * through the shared --qi-* tokens; index.css maps the series colours for
 * light and dark and swaps in the stacked composition below 640px. The
 * fallback SVG in the article is the light desktop drawing, written by
 * generate.mjs from the same plot.mjs, so the two cannot drift.
 */
import { SERIES, LABEL, drawing, LEGEND } from './plot.mjs';

const DESKTOP = {
  w: 960, h: 560, L: 150, R: 900, T: 150, B: 440, titleSize: 22,
  notes: [
    { ms: 0.63, mb: 33, hue: 'blue', lines: ['each doubling of depth', 'doubles bandwidth, latency flat'] },
    { ms: 11, mb: 185, lines: ['past the 16-deep ring, the last 29%', 'of bandwidth costs 15&#215; the wait'] },
    { ms: 2.1, mb: 3.4, hue: 'cyan', lines: ['no pipeline: 256 queued reads change', 'nothing but the wait (129&#215;)'] },
    { ms: 21, mb: 0.28, hue: 'red', anchor: 'end', lines: ['84&#215; the bandwidth,', 'latency flat at 24 ms'] },
  ],
};

const MOBILE = {
  w: 480, h: 610, L: 96, R: 452, T: 158, B: 416, titleSize: 17,
  notes: [
    { ms: 0.7, mb: 46, hue: 'blue', lines: ['depth doubles', 'bandwidth, for free'] },
    { ms: 22, mb: 0.23, hue: 'red', anchor: 'end', lines: ['latency flat', 'at 24 ms'] },
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
