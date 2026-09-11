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

// Theme-following chrome. Defined in components/_viz.scss for light and again
// under [data-theme='dark']; the articles section really does have a dark mode.
const INK = 'var(--viz-ink)';
const MUTED = 'var(--viz-muted)';
const GRIDC = 'var(--viz-grid)';

// Shared layout. Every chart kind uses these, so two charts in different posts
// read as the same object. Widths are pinned in the manifest to the same value
// for the same reason: the SVG scales to the column, so a wider viewBox renders
// identical font sizes smaller.
const LAYOUT = {
  top: 62, right: 36, bottom: 68, left: 74,
  gap: 44, titleY: 20, subtitleY: 38,
};

// Panel heading, shared so the title/subtitle block sits identically everywhere.
const panelHead = (w, title, subtitle) =>
  `<text x="${w / 2}" y="${LAYOUT.titleY}" text-anchor="middle" font-family="${MONO}"`
  + ` font-size="${viz.type.title}" font-weight="700" fill="${INK}">${esc(title)}</text>`
  + (subtitle
    ? `<text x="${w / 2}" y="${LAYOUT.subtitleY}" text-anchor="middle" font-family="${MONO}"`
      + ` font-size="${viz.type.subtitle}" fill="${MUTED}">${esc(subtitle)}</text>`
    : '');

// Rotated y-axis label, shared for the same reason.
const yAxisLabel = (h, text) =>
  `<text transform="translate(13,${(LAYOUT.top + (h - LAYOUT.bottom)) / 2}) rotate(-90)"`
  + ` text-anchor="middle" font-family="${MONO}" font-size="${viz.type.label}"`
  + ` fill="${MUTED}">${esc(text)}</text>`;

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


// Plot puts its typography and fill on the ROOT <svg> — fill="currentColor",
// style="color: …", font-family, font-size — and we keep only innerHTML, so all
// of that is thrown away and every axis label falls back to SVG's default black.
// On the dark theme that is unreadable. Re-apply it on a wrapping <g>; marks
// that set their own fill still win.
const wrapPlot = (inner) =>
  `<g fill="currentColor" style="color:${MUTED}" font-family="${MONO}"`
  + ` font-size="${viz.type.axis}" text-anchor="middle">${inner}</g>`;

// Which CSV columns label a bar. Defaults keep the diskbbq chart working.
const topCol = (c) => c.labelTop || 'engine';
const botCol = (c) => c.labelBottom || 'config';
const keyOf = (c) => (d) => `${d[topCol(c)]}|${d[botCol(c)]}`;

// Powers of ten inside a domain, for log axes.
const decades = ([lo, hi]) => {
  const out = [];
  for (let e = Math.ceil(Math.log10(lo)); Math.pow(10, e) <= hi; e++) out.push(Math.pow(10, e));
  return out;
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function panel(c, p, data, w, h) {
  const barKey = keyOf(c);
  const values = rawCol(c.data, p.y);
  const colors = c.colors
    ? c.colors.map((k) => (k === 'muted' ? viz.palette.muted : viz.palette.categorical[k]))
    : [viz.palette.muted, viz.palette.categorical[0], viz.palette.categorical[3]];
  const { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight } = LAYOUT;

  const node = Plot.plot({
    document: dom.window.document,
    width: w, height: h,
    marginLeft, marginRight, marginTop, marginBottom,
    style: { fontFamily: MONO, fontSize: `${viz.type.axis}px`, background: 'none',
             color: MUTED },
    x: { label: null, domain: data.map(barKey), tickFormat: () => '' },
    // A panel may override the shared max: nDCG and recall live on very
    // different ranges, and a shared axis flattens one of them.
    y: { label: null, domain: [0, p.yMax ?? c.yMax], grid: true, nice: false },
    color: { domain: data.map(barKey), range: colors },
    marks: [
      Plot.barY(data, { x: barKey, y: p.y, fill: barKey, rx: 1.5, inset: 14 }),
      // value label above the bar. Tried inside-the-bar (as ~/projects/blog does)
      // but on this light theme the white-on-fill sits right at the bar's top
      // edge and reads poorly; the original PNG put values above, in ink.
      Plot.text(data, { x: barKey, y: p.y, dy: -9, textAnchor: 'middle', fontFamily: MONO,
        text: (d, i) => `${values[i]}${p.unit ? ' ' + p.unit : ''}`,
        fill: { value: () => INK, scale: null },
        fontSize: viz.type.axis, fontWeight: 600 }),
      Plot.text(data, { x: barKey, dy: 24, frameAnchor: 'bottom', textAnchor: 'middle',
        fontFamily: MONO, text: (d) => d[topCol(c)],
        fill: INK, fontSize: viz.type.axis, fontWeight: 600 }),
      Plot.text(data, { x: barKey, dy: 40, frameAnchor: 'bottom', textAnchor: 'middle',
        fontFamily: MONO, text: (d) => d[botCol(c)],
        fill: MUTED, fontSize: viz.type.label }),
    ],
  });
  const svg = node.tagName.toLowerCase() === 'svg' ? node : node.querySelector('svg');
  // Plot silently drops the `textAnchor` mark option here (the emitted group has
  // no text-anchor, so it defaults to `start` and every label sits half its own
  // width right of the bar). Force it on the text groups it produces.
  let plotted = svg.innerHTML.replaceAll('<g aria-label="text"', '<g text-anchor="middle" aria-label="text"');

  // Tag each bar with its row key (in data order) so js/viz.js can ring the
  // same config in every panel at once. Purely additive — no JS, no effect.
  plotted = plotted.replace(/(<g aria-label="bar"[^>]*>)([\s\S]*?)(<\/g>)/, (m, open, body, close) => {
    let i = 0;
    const tagged = body.replace(/<rect /g, () => `<rect data-viz-key="${esc(barKey(data[i++]))}" `);
    return open + tagged + close;
  });

  // Full-height hit zones, one per category band: you hover the column, not the
  // bar. Focusable so keyboard users get the same readout.
  const plotW = w - marginLeft - marginRight;
  const bandW = plotW / data.length;
  const zones = data.map((d, i) => {
    const rows = c.tooltip.map((t) => ({
      k: t.label,
      v: `${rawCol(c.data, t.field)[i]}${t.unit ? ' ' + t.unit : ''}`,
      c: colors[i],
    }));
    return `<rect data-viz-zone data-viz-key="${esc(barKey(d))}"`
      + ` data-viz-title="${esc(d[topCol(c)] + ' · ' + d[botCol(c)])}"`
      + ` data-viz-rows="${esc(JSON.stringify(rows))}"`
      + ` tabindex="0" role="button" aria-label="${esc(d[topCol(c)] + ' ' + d[botCol(c)])}"`
      + ` x="${marginLeft + i * bandW}" y="${marginTop}" width="${bandW}"`
      + ` height="${h - marginTop - marginBottom}" fill="transparent"/>`;
  }).join('');

  return panelHead(w, p.title, p.subtitle) + yAxisLabel(h, p.axis) + wrapPlot(plotted) + zones;
}


// ── heatmap ────────────────────────────────────────────────────────────────
// Wide CSV (one row per category, one column per series) melted to long form.
// Cell fill is a sequential ramp from data/viz.json; cell text is the value,
// inked light or dark for contrast against its own cell.
function rampColor(t) {
  const stops = viz.sequential.stops;
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const [a, b] = [hex(stops[i]), hex(stops[i + 1])];
  const mix = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return '#' + mix.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function heatmap(c) {
  const [head, ...lines] = readFileSync(c.data, 'utf8').trim().split('\n');
  const cols = head.split(',').slice(1);
  const rows = lines.map((l) => l.split(','));
  const rowNames = rows.map((r) => r[0]);
  const vals = rows.flatMap((r) => r.slice(1).map(Number));
  const lo = c.domain ? c.domain[0] : Math.min(...vals);
  const hi = c.domain ? c.domain[1] : Math.max(...vals);

  const cw = c.cellWidth, ch = c.cellHeight;
  const left = c.marginLeft, top = c.marginTop;
  let out = '';

  // column headers
  cols.forEach((col, j) => {
    out += `<text x="${left + j * cw + cw / 2}" y="${top - 10}" text-anchor="middle"`
      + ` font-family="${MONO}" font-size="${viz.type.axis}"`
      + ` fill="${MUTED}">${esc(col)}</text>`;
  });

  rows.forEach((r, i) => {
    const y = top + i * ch;
    const emphasised = c.highlight && r[0] === c.highlight;
    out += `<text x="${left - 12}" y="${y + ch / 2 + 4}" text-anchor="end" font-family="${MONO}"`
      + ` font-size="${viz.type.axis}" font-weight="${emphasised ? 700 : 400}"`
      + ` fill="${emphasised ? INK : MUTED}">${esc(r[0])}</text>`;
    r.slice(1).forEach((v, j) => {
      const t = (Number(v) - lo) / (hi - lo);
      const fill = rampColor(t);
      const x = left + j * cw;
      // Cells display 2dp; the tooltip carries the full precision from the CSV.
      const tipRows = JSON.stringify([{ k: c.legend || 'recall', v: v, c: fill }]);
      out += `<rect x="${x + 1}" y="${y + 1}" width="${cw - 2}" height="${ch - 2}" rx="2" fill="${fill}"`
        + ` data-viz-key="${esc(r[0] + '|' + cols[j])}"/>`
        + `<text x="${x + cw / 2}" y="${y + ch / 2 + 4}" text-anchor="middle" font-family="${MONO}"`
        + ` font-size="${viz.type.small}" fill="${readableInk(fill)}">${Number(v).toFixed(2)}</text>`
        + `<rect data-viz-zone data-viz-key="${esc(r[0] + '|' + cols[j])}"`
        + ` data-viz-title="${esc(r[0] + ' · ' + cols[j])}" data-viz-rows="${esc(tipRows)}"`
        + ` tabindex="0" role="button" aria-label="${esc(r[0] + ' on ' + cols[j] + ': ' + v)}"`
        + ` x="${x}" y="${y}" width="${cw}" height="${ch}" fill="transparent"/>`;
    });
    if (emphasised) {
      // Ring the recommended row in the CARD colour, not in ink: a surface-coloured
      // outline reads as a clean gap lifting the row out, where an ink outline
      // draws a foreign dark box across red cells.
      out += `<rect x="${left - 1}" y="${y - 1}" width="${cols.length * cw + 2}" height="${ch + 2}" rx="3"`
        + ` fill="none" stroke="var(--viz-surface)" stroke-width="3"/>`;
    }
  });

  // legend
  const lw = 190, lx = left, ly = top + rows.length * ch + 30;
  for (let k = 0; k < lw; k++) {
    out += `<rect x="${lx + k}" y="${ly}" width="1" height="10" fill="${rampColor(k / (lw - 1))}"/>`;
  }
  out += `<text x="${lx}" y="${ly + 24}" font-family="${MONO}" font-size="${viz.type.small}"`
    + ` fill="${MUTED}">${lo.toFixed(2)}</text>`
    + `<text x="${lx + lw}" y="${ly + 24}" text-anchor="end" font-family="${MONO}"`
    + ` font-size="${viz.type.small}" fill="${MUTED}">${hi.toFixed(2)}</text>`
    + `<text x="${lx + lw + 14}" y="${ly + 9}" font-family="${MONO}" font-size="${viz.type.label}"`
    + ` fill="${MUTED}">${esc(c.legend || 'recall')}</text>`;

  return panelHead(2 * left + cols.length * cw, c.title, c.subtitle) + out;
}


// ── lines-facet ────────────────────────────────────────────────────────────
// One small-multiple panel per facet value; two or more series per panel.
// Log y-axis when the manifest asks for it — required here, where the data
// spans 0.3 to 490 RPS and a linear axis flattens the whole story.
function linesFacet(c) {
  const data = readCsv(c.data);
  const facets = [...new Set(data.map((d) => d[c.facet]))];
  const gap = LAYOUT.gap;
  const pw = (c.width - gap * (facets.length - 1)) / facets.length;

  return facets.map((fv, fi) => {
    const rows_ = data.filter((d) => d[c.facet] === fv);
    const node = Plot.plot({
      document: dom.window.document,
      width: pw, height: c.height,
      marginLeft: LAYOUT.left, marginRight: LAYOUT.right,
      marginTop: LAYOUT.top, marginBottom: LAYOUT.bottom,
      style: { fontFamily: MONO, fontSize: `${viz.type.axis}px`, background: 'none',
               color: MUTED },
      x: { type: 'point', label: null, domain: rows_.map((r) => r[c.x]),
           tickFormat: (v) => `${v}${c.xSuffix ?? ''}` },
      // A log axis defaults to a tick at every 1,2,3…9,10,20,30… which draws
      // ~33 gridlines per panel and leaves most tick labels blank. Only the
      // decades earn a line.
      y: { type: c.yScale || 'linear', domain: (c.yDomains && c.yDomains[fv]) || c.yDomain,
           grid: true, label: null,
           ticks: c.yScale === 'log' ? decades(c.yDomain) : undefined },
      marks: [
        ...(c.refLine
          ? [Plot.ruleY([c.refLine.value], { stroke: MUTED, strokeDasharray: '4 3', strokeWidth: 1 }),
             Plot.text([c.refLine], { y: 'value', frameAnchor: 'right', dx: -6, dy: -8,
               textAnchor: 'end', fontFamily: MONO, fontSize: viz.type.label,
               text: (d) => d.label, fill: { value: () => MUTED, scale: null } })]
          : []),
      ].concat(c.series.flatMap((sName, si) => [
        Plot.line(rows_, { x: c.x, y: sName, stroke: viz.palette.categorical[si], strokeWidth: 2 }),
        Plot.dot(rows_, { x: c.x, y: sName, fill: viz.palette.categorical[si], r: 3.5 }),
      ])),
    });
    const svg = node.tagName.toLowerCase() === 'svg' ? node : node.querySelector('svg');
    let plotted = svg.innerHTML.replaceAll('<g aria-label="text"', '<g text-anchor="middle" aria-label="text"');

    // Snap-to-x-column interaction, the way a line chart wants to be read: you
    // hover anywhere in a column and every series reads out together at that x.
    // Take the x positions from Plot's own emitted dots rather than recomputing
    // the point scale — whatever Plot did is the truth.
    const dotGroups = [...plotted.matchAll(/<g aria-label="dot"[\s\S]*?<\/g>/g)].map((m) => m[0]);
    const xs = dotGroups.length
      ? [...dotGroups[0].matchAll(/cx="([\d.]+)"/g)].map((m) => Number(m[1]))
      : [];

    // Tag each dot with its column key so hovering rings every series at that x.
    let gi = 0;
    plotted = plotted.replace(/<g aria-label="dot"[\s\S]*?<\/g>/g, (g) => {
      const si = gi++;
      let ci = 0;
      return g.replace(/<circle /g, () => `<circle data-viz-key="${fv}-x${ci++}" `);
    });

    const step = xs.length > 1 ? xs[1] - xs[0] : 40;
    const top = LAYOUT.top;
    const bot = c.height - LAYOUT.bottom;
    const crosshair = `<line data-viz-crosshair="${fi}" x1="0" y1="${top}" x2="0" y2="${bot}"`
      + ` stroke="${MUTED}" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>`;

    const zones = xs.map((cx, i) => {
      // Rows sorted high to low so the tooltip order matches how the lines
      // actually stack at this x — reading raw series order puts a low line
      // above a high one and the eye has to re-map it every time.
      const rows = c.series
        .map((sName, si) => ({ k: (c.seriesLabels || c.series)[si],
                               n: Number(rows_[i][sName]),
                               c: viz.palette.categorical[si] }))
        .sort((a, b) => b.n - a.n)
        .map((r) => ({ k: r.k, v: `${r.n} ${c.unit || ''}`.trim(), c: r.c }));
      return `<rect data-viz-zone data-viz-key="${fv}-x${i}" data-viz-x="${cx}"`
        + ` data-viz-panel="${fi}"`
        + ` data-viz-title="${esc(c.facetLabel.replace('{}', fv))} · ${esc(rows_[i][c.x])}${esc(c.xSuffix ?? '')}"`
        + ` data-viz-rows="${esc(JSON.stringify(rows))}"`
        + ` tabindex="0" role="button"`
        + ` aria-label="${esc(fv + ' at ' + c.xLabel + ' ' + rows_[i][c.x] + (c.xSuffix ?? ''))}"`
        + ` x="${cx - step / 2}" y="${top}" width="${step}" height="${bot - top}" fill="transparent"/>`;
    }).join('');

    const head = panelHead(pw, c.facetLabel.replace('{}', fv), c.subtitle);
    const xlab = `<text x="${pw / 2}" y="${c.height - LAYOUT.bottom + 56}" text-anchor="middle" font-family="${MONO}"`
      + ` font-size="${viz.type.label}" fill="${MUTED}">${esc(c.xLabel)}</text>`;
    const ylab = yAxisLabel(c.height, (c.yLabels && c.yLabels[fv]) || c.yLabel);
    return `<g transform="translate(${fi * (pw + gap)},0)">${head}${ylab}${wrapPlot(plotted)}${crosshair}${zones}${xlab}</g>`;
  }).join('') + (c.series.length > 1 ? legend(c, c.width) : '');
}

function legend(c, w) {
  const items = c.seriesLabels || c.series;
  const itemW = 190;
  const startX = (w - items.length * itemW) / 2;
  return items.map((name, i) =>
    `<g transform="translate(${startX + i * itemW},${c.height + 16})">`
    + `<rect width="11" height="11" rx="2" fill="${viz.palette.categorical[i]}"/>`
    + `<text x="18" y="10" font-family="${MONO}" font-size="${viz.type.label}"`
    + ` fill="${MUTED}">${esc(name)}</text></g>`).join('');
}


// ── grouped-columns ────────────────────────────────────────────────────────
// Several series side by side within each category. The one shape the other
// kinds cannot express: N categories x M methods.
function groupedColumns(c) {
  const data = readCsv(c.data);
  const groups = [...new Set(data.map((d) => d[c.group]))];
  const series = [...new Set(data.map((d) => d[c.series]))];
  const colors = c.colors.map((k) => (k === 'muted' ? viz.palette.muted : viz.palette.categorical[k]));
  const { top: mT, bottom: mB, left: mL, right: mR } = LAYOUT;

  const node = Plot.plot({
    document: dom.window.document,
    width: c.width, height: c.height,
    marginLeft: mL, marginRight: mR, marginTop: mT, marginBottom: mB,
    style: { fontFamily: MONO, fontSize: `${viz.type.axis}px`, background: 'none', color: MUTED },
    x: { axis: null, domain: series },
    fx: { label: null, domain: groups, tickFormat: (v) => v },
    y: { label: null, domain: [0, c.yMax], grid: true, nice: false },
    color: { domain: series, range: colors },
    marks: [
      Plot.barY(data, { fx: c.group, x: c.series, y: c.y, fill: c.series, rx: 1.5, inset: 2 }),
    ],
  });
  const svg = node.tagName.toLowerCase() === 'svg' ? node : node.querySelector('svg');
  let plotted = svg.innerHTML.replaceAll('<g aria-label="text"', '<g text-anchor="middle" aria-label="text"');

  // Tag every bar with its group key so hovering the column brightens all of
  // its series at once. Plot nests one <g transform> per facet inside a single
  // <g aria-label="bar">, in fx-domain order — which is `groups`.
  plotted = plotted.replace(/(<g aria-label="bar"[^>]*>)([\s\S]*?)(?=<\/g><g aria-label|<\/g>\s*$)/, (m, open, body) => {
    let gi = 0;
    const tagged = body.replace(/<g transform="translate\([^)]*\)"[^>]*>[\s\S]*?<\/g>/g, (facet) => {
      const key = groups[gi++];
      return facet.replace(/<rect /g, () => `<rect data-viz-key="${esc(key)}" `);
    });
    return open + tagged;
  });

  // One hit zone per category group, spanning the plot height.
  const plotW = c.width - mL - mR;
  const gw = plotW / groups.length;
  const zones = groups.map((g, i) => {
    const rows = data.filter((d) => d[c.group] === g)
      .map((d, si) => ({ k: d[c.series], v: d[c.y], c: colors[si] }));
    const delta = data.find((d) => d[c.group] === g)?.[c.deltaField];
    if (delta) rows.push({ k: c.deltaLabel || 'delta', v: delta, c: '' });
    return `<rect data-viz-zone data-viz-key="${esc(g)}" data-viz-title="${esc(g)}"`
      + ` data-viz-rows="${esc(JSON.stringify(rows))}" tabindex="0" role="button"`
      + ` aria-label="${esc(g)}" x="${mL + i * gw}" y="${mT}" width="${gw}"`
      + ` height="${c.height - mT - mB}" fill="transparent"/>`;
  }).join('');

  const legendRow = series.map((name, i) =>
    `<g transform="translate(${(c.width - series.length * 190) / 2 + i * 190},${c.height + 14})">`
    + `<rect width="11" height="11" rx="2" fill="${colors[i]}"/>`
    + `<text x="18" y="10" font-family="${MONO}" font-size="${viz.type.label}"`
    + ` fill="${MUTED}">${esc(name)}</text></g>`).join('');

  return panelHead(c.width, c.title, c.subtitle) + yAxisLabel(c.height, c.yLabel)
    + wrapPlot(plotted) + zones + legendRow;
}

for (const c of manifest) {
  if (c.kind === 'grouped-columns') {
    const out = `assets/viz/${c.id}.svg`;
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${groupedColumns(c)}\n`);
    console.log(`wrote ${out}`);
    continue;
  }
  if (c.kind === 'lines-facet') {
    const out = `assets/viz/${c.id}.svg`;
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${linesFacet(c)}\n`);
    console.log(`wrote ${out}`);
    continue;
  }
  if (c.kind === 'heatmap') {
    const out = `assets/viz/${c.id}.svg`;
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${heatmap(c)}\n`);
    console.log(`wrote ${out}`);
    continue;
  }
  if (c.kind !== 'columns-2panel') throw new Error(`unsupported kind ${c.kind}`);
  const data = readCsv(c.data);
  const gap = LAYOUT.gap;
  const pw = (c.width - gap * (c.panels.length - 1)) / c.panels.length;
  // No frame: gridlines carry the structure, so nothing can touch a border.
  const body = c.panels.map((p, i) =>
    `<g transform="translate(${i * (pw + gap)},0)">${panel(c, p, data, pw, c.height)}</g>`).join('');
  const out = `assets/viz/${c.id}.svg`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${body}\n`);
  console.log(`wrote ${out}`);
}
