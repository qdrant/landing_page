#!/usr/bin/env node
/*
 * Check every chart's CSV against the table its post shows the reader.
 *
 * The same numbers live in two places: the markdown table an author types, and
 * the CSV the chart is drawn from. Nothing else compares them, so a re-run that
 * corrects one and not the other publishes a chart disagreeing with the table
 * directly above it.
 *
 * The CSV is not a copy of the table. It melts wide tables to long, renames
 * labels, and drops columns the chart does not plot. So this cannot diff them.
 * It asks a weaker question that survives all of that:
 *
 *     does every number the chart plots still appear in the table?
 *     does every number in the table still appear in the chart's data?
 *
 * Numbers are compared as parsed floats, so 1.000 and 1.0 match, and units
 * attached in the table ("32.4 QPS") do not matter.
 *
 *   node scripts/viz/check-tables.mjs          # all charts
 *   node scripts/viz/check-tables.mjs --json   # machine readable
 */
import { readFileSync } from 'node:fs';

// Which table in which post each chart was built from. `null` means the chart
// has no source table and never should: see the note on rrf-k/weight below.
const SOURCES = {
  'diskbbq/results':        { post: 'content/blog/benchmark-elastic-diskbbq.md',            header: 'Configuration' },
  'defrag/rps':             { post: 'content/articles/immutable-data-structures.md',        header: '% of hot subset' },
  'oversampling/recall':    { post: 'content/articles/when-your-collection-outgrows-ram.md', header: 'Quantization' },
  'bits1-rescore/recovery': { post: 'content/articles/when-your-collection-outgrows-ram.md', header: 'Quantization' },
  'candidate-depth/sweep':  { post: 'content/articles/candidate-depth.md',                  header: 'Milliseconds per Query' },
  'hybrid/fusion':          { post: 'content/articles/how-to-tune-hybrid-search.md',        header: 'Dense Alone' },
  // Computed, not measured, so there is no table to check it against: the k
  // table in that post is nDCG, a different quantity. Checked against the
  // formula instead, below.
  'rrf-k/weight':           null,
};

const cells = (row) =>
  row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/`/g, ''));

function tableFrom(post, headerMatch) {
  const tables = [];
  let cur = [];
  for (const line of readFileSync(post, 'utf8').split('\n')) {
    if (line.trim().startsWith('|')) cur.push(line);
    else if (cur.length) { tables.push(cur); cur = []; }
  }
  if (cur.length) tables.push(cur);
  const t = tables.find((x) => x[0].includes(headerMatch));
  if (!t) throw new Error(`no table with ${JSON.stringify(headerMatch)} in ${post}`);
  const header = cells(t[0]);
  return { header, rows: t.slice(2).map((r) => cells(r)) };
}

/*
 * A measurement, or null. The whole cell must be one number, optionally with a
 * unit: "32.4 QPS", "+0.0289", "2.5%". Anything else is a label, even though it
 * starts with a digit: "7 vCPU / 26 GB" and "3 x 7 vCPU / 26 GB RF=2" are
 * configuration, and reading 7 or 3 out of them as data invents disagreements.
 */
const UNIT = /^[+-]?\d+(?:\.\d+)?\s*(?:%|ms|s|QPS|GB|GiB|MB|KB|k|M)?$/i;
const num = (s) => {
  const t = String(s).replace(/,/g, '').trim();
  if (!UNIT.test(t)) return null;
  return parseFloat(t);
};

/** Columns where most cells are measurements are data; the rest are labels. */
function numericColumns(header, rows) {
  return header
    .map((_, i) => i)
    .filter((i) => rows.filter((r) => num(r[i]) !== null).length > rows.length / 2);
}

function csvOf(path) {
  const [head, ...rows] = readFileSync(path, 'utf8').trim().split('\n');
  const cols = head.split(',');
  return { cols, rows: rows.map((r) => r.split(',')) };
}

const near = (a, b) => Math.abs(a - b) < 1e-9;
const has = (set, v) => [...set].some((x) => near(x, v));

/*
 * rrf-k/weight has no source table: `share` is the share of fused score one
 * result contributes at a given rank. Qdrant's rank is 0-indexed, so the weight
 * is 1/(k + rank - 1), not 1/(k + rank). The post states this itself: "The
 * original RRF paper uses 60, which maps to k=61 in Qdrant's formula", and 60
 * only maps to 61 under the 0-indexed form. Checked to 0.06pp, since the CSV
 * carries one decimal.
 */
function checkRrfK(csv) {
  const [ri, ki, si] = ['rank', 'k', 'share'].map((c) => csv.cols.indexOf(c));
  const series = new Map();
  for (const r of csv.rows) {
    if (!series.has(r[ki])) series.set(r[ki], []);
    series.get(r[ki]).push([parseInt(r[ri], 10), parseFloat(r[si])]);
  }
  const off = [];
  for (const [label, pts] of series) {
    const k = parseFloat(label.split('=')[1]);
    pts.sort((a, b) => a[0] - b[0]);
    const w = pts.map(([rank]) => 1 / (k + rank - 1));
    const tot = w.reduce((a, b) => a + b, 0);
    pts.forEach(([rank, got], i) => {
      const exp = (100 * w[i]) / tot;
      if (Math.abs(got - exp) > 0.06)
        off.push(`${label} rank ${rank}: csv ${got}, formula ${exp.toFixed(2)}`);
    });
  }
  return { formula: '1/(k + rank - 1), normalised', series: series.size, offBy: off };
}

const results = [];
for (const [id, src] of Object.entries(SOURCES)) {
  const csv = csvOf(`assets/viz/${id}.csv`);
  const csvNums = new Set();
  for (const i of numericColumns(csv.cols, csv.rows))
    for (const r of csv.rows) { const v = num(r[i]); if (v !== null) csvNums.add(v); }

  if (!src) {
    results.push({ id, ...checkRrfK(csv), csvRows: csv.rows.length });
    continue;
  }

  const tbl = tableFrom(src.post, src.header);
  const tblNums = new Set();
  for (const i of numericColumns(tbl.header, tbl.rows))
    for (const r of tbl.rows) { const v = num(r[i]); if (v !== null) tblNums.add(v); }

  results.push({
    id,
    post: src.post.split('/').pop(),
    csvRows: csv.rows.length,
    tableRows: tbl.rows.length,
    notInTable: [...csvNums].filter((v) => !has(tblNums, v)),
    notInCsv:   [...tblNums].filter((v) => !has(csvNums, v)),
  });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
} else {
  let bad = 0;
  for (const r of results) {
    if (r.formula) {
      const ok = r.offBy.length === 0;
      if (!ok) bad++;
      console.log(`\n${ok ? 'ok ' : 'XX '} ${r.id}   (no table: checked against the formula)`);
      console.log(`      ${r.csvRows} csv rows, ${r.series} series, share = ${r.formula}`);
      r.offBy.forEach((l) => console.log(`      FAIL  ${l}`));
      continue;
    }
    // Only one direction is a failure. A chart plotting a SUBSET of its table is
    // normal and deliberate, so unplotted table values are reported, not failed.
    const ok = r.notInTable.length === 0;
    if (!ok) bad++;
    console.log(`\n${ok ? 'ok ' : 'XX '} ${r.id}   (${r.post})`);
    console.log(`      ${r.csvRows} csv rows, ${r.tableRows} table rows`);
    if (r.notInTable.length)
      console.log(`      FAIL  plotted but not in the table: ${r.notInTable.join(', ')}`);
    if (r.notInCsv.length)
      console.log(`      note  in the table, not plotted: ${r.notInCsv.join(', ')}`);
  }
  console.log(`\n${bad === 0
    ? 'every plotted number is present in its source table'
    : `${bad} chart(s) plot a number their table does not contain`}`);
  process.exitCode = bad === 0 ? 0 : 1;
}
