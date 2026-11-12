// The same drawing renders the island and its self-contained static fallback.
export const counts = [10, 25, 50, 100, 200];
export const height = 300;
export const format = value => `${value >= 0 ? '+' : ''}${value.toFixed(6)}`;
export function drawing(series, width = 760, legend = false) {
  const left = 54, right = width - 20, top = 42, bottom = 246;
  // Preserve the original logarithmic candidate axis and shared gain range.
  const x = count => left + Math.log(count / 10) / Math.log(20) * (right - left);
  const y = value => bottom - (value + 0.05) / 0.2 * (bottom - top);
  let body = `<rect width="${width}" height="${height}" fill="var(--qi-surface,#f0f3fa)"/>`;
  body += `<text x="${left}" y="20" font-size="14" fill="var(--qi-fg,#303547)">nDCG@10 change over tuned fusion</text>`;
  for (const tick of [-0.05, 0, 0.05, 0.1, 0.15]) {
    body += `<line x1="${left}" y1="${y(tick)}" x2="${right}" y2="${y(tick)}" stroke="${tick === 0 ? 'var(--qi-muted,#656b7f)' : 'var(--qi-line,#abb1c7)'}" ${tick === 0 ? 'stroke-dasharray="5 4" stroke-width="2"' : 'stroke-width="1"'}/><text x="${left - 8}" y="${y(tick) + 5}" text-anchor="end" font-size="13" fill="var(--qi-muted,#656b7f)">${tick.toFixed(2)}</text>`;
  }
  for (const count of counts) body += `<text x="${x(count)}" y="267" text-anchor="middle" font-size="13" fill="var(--qi-fg,#303547)">${count}</text>`;
  body += `<text x="${(left + right) / 2}" y="292" text-anchor="middle" font-size="14" fill="var(--qi-muted,#656b7f)">Candidate count (log scale)</text>`;
  series.forEach((s, i) => {
    body += `<g data-series="${i}" style="color:${s.color}"><path class="rg-outline" d="${s.values.map((v, j) => `${j ? 'L' : 'M'}${x(counts[j])},${y(v)}`).join(' ')}" stroke="var(--qi-fg,#303547)" stroke-width="4" fill="none"/><path class="rg-line" d="${s.values.map((v, j) => `${j ? 'L' : 'M'}${x(counts[j])},${y(v)}`).join(' ')}" stroke="currentColor" stroke-width="2.5" fill="none"/>`;
    s.values.forEach((v, j) => {
      body += `<circle class="rg-point" cx="${x(counts[j])}" cy="${y(v)}" r="3.5" fill="currentColor"/>`;
      body += `<circle data-point="${j}" cx="${x(counts[j])}" cy="${y(v)}" r="10" fill="transparent" tabindex="0" role="button" aria-label="${s.name}, ${counts[j]} candidates, change ${format(v)}"><title>${s.name}: ${format(v)} at ${counts[j]} candidates</title></circle>`;
    });
    body += '</g>';
  });
  if (legend) {
    body += '<rect x="0" y="300" width="760" height="72" fill="#f0f3fa"/>';
    series.forEach((s, i) => {
      const lx = 24 + (i % 3) * 250, ly = 325 + Math.floor(i / 3) * 28;
      body += `<line x1="${lx}" y1="${ly - 5}" x2="${lx + 24}" y2="${ly - 5}" stroke="${s.color}" stroke-width="3"/><text x="${lx + 32}" y="${ly}" fill="#303547" font-size="14">${s.name}</text>`;
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${legend ? 372 : height}" class="qi-svg" font-family="'Mona Sans',Arial,sans-serif" role="img" aria-label="Best reranker gain over tuned fusion by candidate count">${body}</svg>`;
}
