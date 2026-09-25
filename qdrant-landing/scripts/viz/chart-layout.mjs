// SVG units, before the host scales the chart. No browser-only measurement.
// Conservative monospace advances leave space for font substitution.
const advance = (text, size) => [...text].length * size * 0.66;

export function wrapText(text, size, width) {
  const limit = Math.max(1, Math.floor(width / (size * 0.66)));
  const words = String(text || '').split(/\s+/).flatMap(word => {
    const chunks = [];
    while (word.length > limit) {
      chunks.push(word.slice(0, limit));
      word = word.slice(limit);
    }
    if (word) chunks.push(word);
    return chunks;
  });
  const lines = [];
  for (const word of words) {
    const last = lines.length - 1;
    if (last >= 0 && advance(`${lines[last]} ${word}`, size) <= width) lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines;
}

export function chartLayout(spec, series, type, groups = []) {
  const width = spec.width;
  const views = spec.views?.length ? spec.views.map(view => ({ ...spec, ...view })) : [spec];
  const headings = views.map(view => {
    let y = type.title + 8;
    const lines = [];
    for (const [text, size, weight] of [[view.title, type.title, 700], [view.subtitle, type.subtitle, 400]]) {
      for (const line of wrapText(text, size, width - 72)) {
        lines.push({ text: line, size, weight, y });
        y += size * 1.5;
      }
    }
    return { lines, bottom: y };
  });
  const top = Math.ceil(Math.max(...headings.map(h => h.bottom)) + 20);
  const bottom = Math.ceil(Math.max(48, type.axis * 3));
  if (spec.height - top - bottom < 140) throw new Error(`${spec.id}: height leaves less than 140 units for the plot`);
  const left = Math.ceil(Math.max(74, type.axis * 4.5));
  const axisCenter = (top + spec.height - bottom) / 2;
  for (const view of views) {
    const halfLabel = advance(String(view.yLabel || ''), type.label) / 2;
    if (axisCenter - halfLabel < 8 || axisCenter + halfLabel > spec.height - 8) {
      throw new Error(`${spec.id}: y-axis label does not fit; shorten the label or increase height`);
    }
  }
  const groupWidth = (width - left - 36) / groups.length;
  if (groups.some(group => advance(String(group), type.axis) > groupWidth - 8)) {
    throw new Error(`${spec.id}: group labels do not fit; shorten the labels or increase width`);
  }

  const gap = 28;
  const widths = series.map(name => 18 + advance(name, type.label));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (series.length - 1);
  const mode = spec.legendLayout ?? 'auto';
  const row = mode === 'row' || (mode === 'auto' && total <= width - 48);
  if (row && total > width - 48) throw new Error(`${spec.id}: legend row does not fit; use auto or stacked, or increase width`);
  let x = (width - total) / 2;
  let y = spec.height + type.label + 8;
  const legend = series.map((name, i) => {
    const lines = row ? [name] : wrapText(name, type.label, width - 84);
    const itemWidth = 18 + Math.max(...lines.map(line => advance(line, type.label)));
    const item = { x: row ? x : (width - itemWidth) / 2, y, lines };
    if (row) x += widths[i] + gap;
    else y += lines.length * type.label * 1.5 + 8;
    return item;
  });
  const requiredRoom = Math.ceil((row ? type.label + 8 : y - spec.height) + 16);
  if (spec.legendRoom !== undefined && spec.legendRoom < requiredRoom) throw new Error(`${spec.id}: legendRoom must be at least ${requiredRoom}`);
  return { headings, legend, top, bottom, left, height: spec.height + (spec.legendRoom ?? requiredRoom) };
}
