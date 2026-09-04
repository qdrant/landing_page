#!/usr/bin/env node
// Generate chart SVGs from data/viz-charts.json. Output is committed.
// Emits INNER svg markup only; layouts/partials/viz-figure.html supplies the outer <svg>.
//
// Design language borrowed from ~/projects/blog components/BarChart.jsx:
//   - no frame around the plot; faint hairline gridlines carry the structure
//   - monospace for every numeric/label glyph, so digits align in a column
//   - value labels sit INSIDE the top of each bar, not floating above it
//   - title + muted subtitle, centred
//   - plain rotated y-axis label, no arrow
// Colours stay Qdrant's (data/viz.json), not that blog's terminal-green.
import * as Plot from '@observablehq/plot';
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const viz = JSON.parse(readFileSync('data/viz.json', 'utf8'));
const manifest = JSON.parse(readFileSync('data/viz-charts.json', 'utf8'));
const dom = new JSDOM('');
const MONO = viz.type.mono;

const readCsv = (p) => {
  const [head, ...rows] = readFileSync(p, 'utf8').trim().split('\n');
  const cols = head.split(',');
  return rows.map((r) => Object.fromEntries(r.split(',').map((v, i) =>
    [cols[i], v !== '' && !Number.isNaN(Number(v)) ? Number(v) : v])));
};

// Keep the source's own decimal formatting: 86.0 must not print as 86.
const rawCol = (p, col) => {
  const [head, ...rows] = readFileSync(p, 'utf8').trim().split('\n');
  const i = head.split(',').indexOf(col);
  return rows.map((r) => r.split(',')[i]);
};

// Pick legible ink for text sitting on a coloured bar.
const readableInk = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? viz.surface.ink : '#ffffff';
};

const barKey = (d) => `${d.engine}|${d.config}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function panel(c, p, data, w, h) {
  const values = rawCol(c.data, p.y);
  const colors = [viz.palette.muted, viz.palette.categorical[0], viz.palette.categorical[3]];
  const marginTop = 66, marginBottom = 64, marginLeft = 56, marginRight = 40;

  const node = Plot.plot({
    document: dom.window.document,
    width: w, height: h,
    marginLeft, marginRight, marginTop, marginBottom,
    style: { fontFamily: MONO, fontSize: `${viz.type.tick}px`, background: 'none',
             color: viz.surface.inkMuted },
    x: { label: null, domain: data.map(barKey), tickFormat: () => '' },
    y: { label: null, domain: [0, c.yMax], grid: true, nice: false },
    color: { domain: data.map(barKey), range: colors },
    marks: [
      Plot.barY(data, { x: barKey, y: p.y, fill: barKey, rx: 1.5, inset: 14 }),
      // value label above the bar. Tried inside-the-bar (as ~/projects/blog does)
      // but on this light theme the white-on-fill sits right at the bar's top
      // edge and reads poorly; the original PNG put values above, in ink.
      Plot.text(data, { x: barKey, y: p.y, dy: -9, textAnchor: 'middle', fontFamily: MONO,
        text: (d, i) => `${values[i]}${p.unit ? ' ' + p.unit : ''}`,
        fill: { value: () => viz.surface.ink, scale: null },
        fontSize: viz.type.tick, fontWeight: 600 }),
      Plot.text(data, { x: barKey, dy: 22, frameAnchor: 'bottom', textAnchor: 'middle',
        fontFamily: MONO, text: (d) => d.engine,
        fill: viz.surface.ink, fontSize: viz.type.tick, fontWeight: 600 }),
      Plot.text(data, { x: barKey, dy: 40, frameAnchor: 'bottom', textAnchor: 'middle',
        fontFamily: MONO, text: (d) => d.config,
        fill: viz.surface.inkMuted, fontSize: viz.type.tick - 1 }),
    ],
  });
  const svg = node.tagName.toLowerCase() === 'svg' ? node : node.querySelector('svg');
  // Plot silently drops the `textAnchor` mark option here (the emitted group has
  // no text-anchor, so it defaults to `start` and every label sits half its own
  // width right of the bar). Force it on the text groups it produces.
  const plotted = svg.innerHTML.replaceAll('<g aria-label="text"', '<g text-anchor="middle" aria-label="text"');

  const head =
    `<text x="${w / 2}" y="22" text-anchor="middle" font-family="${MONO}"`
    + ` font-size="${viz.type.label}" font-weight="700" fill="${viz.surface.ink}">${esc(p.title)}</text>`
    + (p.subtitle
      ? `<text x="${w / 2}" y="40" text-anchor="middle" font-family="${MONO}"`
        + ` font-size="${viz.type.tick}" fill="${viz.surface.inkMuted}">${esc(p.subtitle)}</text>`
      : '');
  const midY = (marginTop + (h - marginBottom)) / 2;
  const axisLabel = `<text transform="translate(13,${midY}) rotate(-90)" text-anchor="middle"`
    + ` font-family="${MONO}" font-size="${viz.type.tick - 1}"`
    + ` fill="${viz.surface.inkMuted}">${esc(p.axis)}</text>`;
  return head + axisLabel + plotted;
}

for (const c of manifest) {
  if (c.kind !== 'columns-2panel') throw new Error(`unsupported kind ${c.kind}`);
  const data = readCsv(c.data);
  const gap = 44;
  const pw = (c.width - gap) / 2;
  // No frame: gridlines carry the structure, so nothing can touch a border.
  const body = c.panels.map((p, i) =>
    `<g transform="translate(${i * (pw + gap)},0)">${panel(c, p, data, pw, c.height)}</g>`).join('');
  const out = `assets/viz/${c.id}.svg`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${body}\n`);
  console.log(`wrote ${out}`);
}
