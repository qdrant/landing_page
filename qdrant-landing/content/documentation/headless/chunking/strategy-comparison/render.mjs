// Run from any directory: node <path>/strategy-comparison/render.mjs
// Static, editable SVGs. The host owns the background; image color-scheme
// selects the shared light/dark foreground roles, including with no JavaScript.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { WORDS, STRATEGIES, repeatedPositions } from './model.mjs';

const destination = new URL('../../../../../static/guides_data/chunking/', import.meta.url);
const reference = await readFile(new URL('complete-task.svg', destination), 'utf8');
const fontFace = reference.match(/@font-face\{[^}]+\}/)?.[0];
assert(fontFace?.includes('data:font/woff;base64,'), 'The reference needs its embedded Geist Mono font.');
assert.equal(WORDS.length, 41, 'Keep the illustrated word positions synchronized with the prose.');

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character]);
const n = value => Number(value.toFixed(2));
const palette = ['#6047ff', '#9c27b0', '#00838f', '#dc244c'];

const panels = [
  { id: 'windows', title: 'Length and overlap', strategies: ['fixed', 'sliding-window'] },
  { id: 'structure', title: 'Document structure', strategies: ['sentence', 'paragraph', 'recursive'] },
  { id: 'models', title: 'Model-selected boundaries', strategies: ['semantic', 'agentic'] },
];

function render(mobile, panel) {
  const strategies = panel ? panel.strategies.map(id => STRATEGIES.find(strategy => strategy.id === id)) : STRATEGIES;
  const width = mobile ? 360 : 640;
  const inset = mobile ? 12 : 20;
  const plotWidth = width - inset * 2;
  const fontSize = mobile ? 16 : 20;
  const labelSize = mobile ? 16 : 18;
  const barHeight = mobile ? 22 : 24;
  const rowGap = mobile ? 108 : 112;
  const trackGap = mobile ? 47 : 50;
  const x = offset => inset + offset * plotWidth / WORDS.length;
  const drawing = [];
  const text = (left, top, value, { size = fontSize, weight = 400, fill = 'var(--ink)', anchor = 'start' } = {}) =>
    drawing.push(`<text x="${n(left)}" y="${n(top)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escape(value)}</text>`);

  text(inset, 26, panel?.title ?? 'Same passage, different boundaries', { weight: 600 });
  text(inset, 54, panel ? 'Source word position (1–41)' : '41 source words, not model tokens', { size: labelSize });
  if (!panel) {
    text(inset, 82, 'Export 1–35 | Billing 36–41', { size: labelSize });
    text(inset, 110, 'Each colored bar is one chunk.', { size: labelSize });
  }

  const axisTop = panel ? 87 : 143;
  [1, 10, 20, 30, 41].forEach(word => {
    const left = x(word - 0.5);
    text(left, axisTop, word, { size: labelSize, anchor: word === 1 ? 'start' : word === 41 ? 'end' : 'middle' });
    drawing.push(`<path d="M${n(left)} ${axisTop + 6}v8" stroke="var(--muted)" stroke-width="1.5"/>`);
  });
  drawing.push(`<path d="M${inset} ${axisTop + 14}H${width - inset}" stroke="var(--muted)" stroke-width="1.5"/>`);

  let top = axisTop + 42;
  for (const strategy of strategies) {
    const sliding = strategy.id === 'sliding-window';
    drawing.push(`<g id="${strategy.id}" aria-label="${escape(strategy.name)}">`);
    text(inset, top, strategy.name, { weight: 600 });
    text(inset, top + 24, strategy.setting, { size: labelSize });
    const barTop = top + 60;
    strategy.ranges.forEach(([start, end], index) => {
      const track = sliding ? index % 2 : 0;
      const y = barTop + track * trackGap;
      const left = x(start) + 1;
      const right = x(end) - 1;
      const range = `${start + 1}–${end}`;
      const shortLast = end === WORDS.length && (end - start) < 7;
      text(shortLast ? right : (left + right) / 2, y - 7, range, {
        size: labelSize, anchor: shortLast ? 'end' : 'middle',
      });
      drawing.push(`<rect x="${n(left)}" y="${y}" width="${n(right - left)}" height="${barHeight}" rx="3" fill="${palette[index % palette.length]}" fill-opacity=".3" stroke="var(--ink)" stroke-width="1.5"/>`);
      const repeated = repeatedPositions(strategy.ranges, index);
      if (repeated.length) {
        // All overlap in this sliding-window example is one contiguous prefix.
        assert.equal(repeated.at(-1) - repeated[0] + 1, repeated.length);
        drawing.push(`<rect x="${n(left + 2)}" y="${y + 3}" width="${n(x(repeated.at(-1) + 1) - left - 5)}" height="${barHeight - 6}" rx="1" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="3 2"/>`);
      }
    });
    if (sliding) text(inset, barTop + trackGap + barHeight + 24, 'Dashed spans repeat 4 words.', { size: labelSize });
    drawing.push('</g>');
    top += rowGap + (sliding ? trackGap + 28 : 0);
  }
  if (!panel) {
    text(inset, top - 3, 'Semantic / agentic: illustrative.', { size: labelSize });
    text(inset, top + 23, 'Equal spans can use different rules.', { size: labelSize });
  }
  const height = top + (panel ? 15 : 39);
  const rangesDescription = strategies.map(strategy => `${strategy.name} (${strategy.setting}): ${strategy.ranges.map(([start, end]) => `${start + 1}–${end}`).join(', ')}.`).join(' ');
  const description = rangesDescription + (panel
    ? ' All rows use the same 41 source words, excluding headings, on the same word-position scale. Export occupies words 1–35; Billing occupies words 36–41. Each colored bar is one chunk.'
      + (strategies.some(strategy => strategy.id === 'sliding-window') ? ' Dashed spans are the first four words repeated in each later sliding window, for 16 repeated word appearances.' : '')
      + (strategies.some(strategy => strategy.id === 'semantic' || strategy.id === 'agentic') ? ' Semantic and agentic outputs are illustrative, not model measurements.' : '')
      + ' These configurations explain boundaries, not comparative retrieval performance.'
    : ' All rows use the same source-word position scale. Dashed spans are the first four words repeated in each later sliding window, for 16 repeated word appearances. Semantic and agentic outputs are illustrative, not model measurements. These configurations explain boundaries, not comparative retrieval performance.');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escape(panel ? `${panel.title} on the same export passage` : 'Seven chunking strategies on the same export passage')}</title>
<desc id="desc">${escape(description)}</desc>
<!-- Generated by content/documentation/headless/chunking/strategy-comparison/render.mjs.
     Transparent background, editable text and shapes, embedded Geist Mono.
     Chrome and category colors follow assets/shortcodes/_qi-tokens.scss. -->
<style>
${fontFace}
:root{--ink:#303547;--muted:#656b7f}
@media(prefers-color-scheme:dark){:root{--ink:#e2e7f5;--muted:#898ea3}}
text{font-family:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
</style>
${drawing.join('\n')}
</svg>
`;
}

for (const mobile of [false, true]) {
  const filename = `strategy-comparison${mobile ? '.mobile' : ''}.svg`;
  await writeFile(new URL(filename, destination), render(mobile));
  console.log(`Generated ${filename}`);
  for (const panel of panels) {
    const panelFilename = `strategy-comparison-${panel.id}${mobile ? '.mobile' : ''}.svg`;
    await writeFile(new URL(panelFilename, destination), render(mobile, panel));
    console.log(`Generated ${panelFilename}`);
  }
}
