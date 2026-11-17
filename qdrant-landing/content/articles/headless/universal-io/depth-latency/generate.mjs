/* Writes the article's static fallback from the same drawing the island uses.
   Run from the repo root:
     node content/articles/headless/universal-io/depth-latency/generate.mjs */
import { writeFileSync } from 'node:fs';
import { LABEL, body } from './index.js';

const CHROME = `
  .dl-title{fill:#303547;font-size:14px}.dl-axlbl{fill:#656b7f;font-size:14px}
  .dl-tick{fill:#656b7f;font-size:13px}.dl-legend{fill:#303547;font-size:14px}
  .dl-callout{fill:currentColor;font-size:13px;font-weight:600}
  .dl-callout--cont{font-weight:400}
  .dl-grid{stroke:#abb1c7;stroke-width:1;opacity:.45}
  .dl-axis{stroke:#656b7f;stroke-width:1.5;fill:none}
  .dl-outline{stroke:#303547;stroke-width:4;fill:none;stroke-linejoin:round;stroke-linecap:round}
  .dl-line{stroke:currentColor;stroke-width:2.5;fill:none;stroke-linejoin:round;stroke-linecap:round}
  .dl-dot{fill:currentColor}.dl-dot--off{fill:#f0f3fa;stroke:currentColor;stroke-width:2}.dl-ghost .dl-line{opacity:.25;stroke-width:2}.dl-hit{display:none}
  .dl-cyan{color:#00838f}.dl-blue{color:#6047ff}.dl-red{color:#dc244c}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 372" `
  + `font-family="'Mona Sans',Arial,sans-serif" role="img" aria-label="${LABEL}">`
  + `<style>${CHROME}</style><rect width="760" height="372" fill="#f0f3fa"/>`
  + body('d') + '</svg>';

writeFileSync(new URL('../../../../../static/articles_data/universal-io/uio-depth-latency.svg', import.meta.url), svg);
console.log('wrote uio-depth-latency.svg,', svg.length, 'bytes');
