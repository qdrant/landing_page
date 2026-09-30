#!/usr/bin/env node
/*
 * Extract one markdown table from a post as JSON rows.
 *
 * Ad-hoc regexes over "lines starting with |" keep picking up rows from OTHER
 * tables in the same post — three separate bugs so far, one of which silently
 * appended junk rows to a CSV. Select a table by a string in its header
 * instead, and take only that table's rows.
 *
 *   node scripts/viz/extract-table.mjs <post.md> "<text in header>"
 */
import { readFileSync } from 'node:fs';

const [post, headerMatch] = process.argv.slice(2);
if (!post || !headerMatch) {
  console.error('usage: extract-table.mjs <post.md> "<text in header>"');
  process.exit(1);
}

const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/`/g, ''));

const tables = [];
let cur = [];
for (const line of readFileSync(post, 'utf8').split('\n')) {
  if (line.trim().startsWith('|')) cur.push(line);
  else if (cur.length) { tables.push(cur); cur = []; }
}
if (cur.length) tables.push(cur);

const table = tables.find((t) => t[0].includes(headerMatch));
if (!table) {
  console.error(`no table with ${JSON.stringify(headerMatch)} in its header; found ${tables.length} tables:`);
  tables.forEach((t, i) => console.error(`  [${i}] ${cells(t[0]).join(' | ')}`));
  process.exit(1);
}

const header = cells(table[0]);
const rows = table.slice(2).map((r) => Object.fromEntries(cells(r).map((v, i) => [header[i], v])));
process.stdout.write(JSON.stringify({ header, rows }, null, 2));
