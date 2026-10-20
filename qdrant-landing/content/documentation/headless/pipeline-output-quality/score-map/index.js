// Each score connects only the two artifacts it reads. Components use rounded,
// filled boxes; artifacts use square outlines with an inset document rule.
const NS = 'http://www.w3.org/2000/svg';
const DESCRIPTION = 'Answer relevancy compares the Answer with the Question. Faithfulness compares the Answer with the Top 10 passages. Recall at 10 compares the Top 10 passages with the Golden set relevance labels. Context precision compares the Top 10 passages with the Golden set reference answer.';
let instance = 0;

function element(tag, attributes = {}) {
  const result = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) result.setAttribute(key, value);
  return result;
}

function label(parent, x, y, value, className = '', anchor = 'start') {
  const text = element('text', { x, y, class: `qi-label ${className}` });
  // The shared stylesheet can set text-anchor, so use the inline style here.
  text.style.textAnchor = anchor;
  text.textContent = value;
  parent.append(text);
}

function path(parent, d, kind, marker) {
  const line = element('path', { d, class: `qi-sm__line qi-sm__${kind}` });
  if (marker) line.setAttribute('marker-end', `url(#${marker})`);
  parent.append(line);
}

function box(parent, x, y, width, title, subtitle) {
  parent.append(element('rect', {
    x, y, width, height: 64, rx: subtitle ? 9 : 2,
    class: subtitle ? 'qi-sm__component' : 'qi-sm__artifact',
  }));
  if (!subtitle) path(parent, `M ${x + 6} ${y + 10} V ${y + 54}`, 'document');
  label(parent, x + width / 2, y + (subtitle ? 27 : 38), title, 'qi-label--strong qi-sm__box-label', 'middle');
  if (subtitle) label(parent, x + width / 2, y + 48, subtitle, 'qi-sm__gloss', 'middle');
}

function metric(parent, x, y, name, gloss, kind, anchor = 'middle') {
  label(parent, x, y, name, `qi-sm__metric qi-sm__${kind}`, anchor);
  const lines = Array.isArray(gloss) ? gloss : [gloss];
  lines.forEach((line, index) => label(parent, x, y + 22 + index * 19, line, 'qi-sm__gloss', anchor));
}

function goldenFrame(parent, x, y, width, height) {
  parent.append(element('rect', { x, y, width, height, rx: 8, class: 'qi-frame' }));
  label(parent, x + 18, y + 26, 'Golden set', 'qi-frame-label');
}

function desktop(svg, arrow) {
  label(svg, 16, 26, 'Answer scores', 'qi-sm__heading');
  metric(svg, 350, 60, 'answer_relevancy', 'addresses the question', 'answer');
  path(svg, 'M 58 210 V 100 H 654 V 210', 'answer');
  metric(svg, 490, 136, 'faithfulness', 'claims the passages support', 'answer');
  path(svg, 'M 350 210 V 176 H 632 V 210', 'answer');

  const boxes = [
    [16, 88, 'Question'], [136, 104, 'Qdrant', 'retrieval'],
    [280, 148, 'Top 10 passages'], [468, 112, 'Generator', 'LLM + prompt'],
    [620, 76, 'Answer'],
  ];
  boxes.forEach(([x, width, title, subtitle], index) => {
    box(svg, x, 210, width, title, subtitle);
    if (index < boxes.length - 1) path(svg, `M ${x + width} 242 H ${boxes[index + 1][0]}`, 'pipeline', arrow);
  });

  label(svg, 16, 312, 'Retrieval scores', 'qi-sm__heading');
  metric(svg, 158, 352, 'recall@10', 'labeled passages found, no judge', 'retrieval');
  metric(svg, 548, 352, 'context_precision', 'supporting passages ranked first', 'retrieval');
  goldenFrame(svg, 32, 424, 648, 118);
  path(svg, 'M 330 274 V 396 H 174 V 464', 'retrieval');
  path(svg, 'M 378 274 V 396 H 538 V 464', 'retrieval');
  box(svg, 64, 464, 220, 'Relevance labels');
  box(svg, 428, 464, 220, 'Reference answer');
}

function narrow(svg, arrow) {
  label(svg, 16, 26, 'Answer scores', 'qi-sm__heading');
  // Left-side answer brackets are nested; the vertical pipeline stays intact.
  path(svg, 'M 182 84 H 12 V 476 H 182', 'answer');
  path(svg, 'M 182 280 H 34 V 458 H 182', 'answer');
  metric(svg, 24, 132, 'answer_relevancy', ['addresses', 'the question'], 'answer', 'start');
  metric(svg, 46, 344, 'faithfulness', ['claims the', 'passages support'], 'answer', 'start');

  const boxes = [
    [52, 'Question'], [150, 'Qdrant', 'retrieval'], [248, 'Top 10 passages'],
    [346, 'Generator', 'LLM + prompt'], [444, 'Answer'],
  ];
  boxes.forEach(([y, title, subtitle], index) => {
    box(svg, 182, y, 144, title, subtitle);
    if (index < boxes.length - 1) path(svg, `M 254 ${y + 64} V ${boxes[index + 1][0]}`, 'pipeline', arrow);
  });

  label(svg, 16, 552, 'Retrieval scores', 'qi-sm__heading');
  goldenFrame(svg, 24, 796, 302, 224);
  // Separate outside gutters preserve both comparisons without passing through
  // pipeline components, answer brackets, or the other metric's annotation.
  path(svg, 'M 194 312 V 328 H 166 V 574 H 12 V 866 H 44', 'retrieval');
  path(svg, 'M 326 294 H 342 V 958 H 306', 'retrieval');
  metric(svg, 28, 620, 'recall@10', ['labeled passages found,', 'no judge'], 'retrieval', 'start');
  metric(svg, 326, 722, 'context_precision', ['supporting passages', 'ranked first'], 'retrieval', 'end');
  box(svg, 44, 834, 262, 'Relevance labels');
  box(svg, 44, 926, 262, 'Reference answer');
}

export function mount(node) {
  node.classList.add('qi-sm', 'qi-fig');
  const arrow = `qi-sm-arrow-${++instance}`;
  let previousLayout;

  function render(width) {
    const small = width < 520;
    if (small === previousLayout) return;
    previousLayout = small;
    const svg = element('svg', {
      class: `qi-svg qi-sm__svg${small ? ' qi-sm__svg--narrow' : ''}`,
      viewBox: small ? '0 0 350 1036' : '0 0 712 558',
      role: 'img', 'aria-label': DESCRIPTION,
    });
    const defs = element('defs');
    const marker = element('marker', {
      id: arrow, viewBox: '0 0 8 8', refX: 8, refY: 4,
      markerWidth: 6, markerHeight: 6, orient: 'auto',
    });
    marker.append(element('path', { d: 'M 0 0 L 8 4 L 0 8 Z', class: 'qi-sm__arrowhead' }));
    defs.append(marker);
    svg.append(defs);
    (small ? narrow : desktop)(svg, arrow);
    node.replaceChildren(svg);
  }

  render(node.getBoundingClientRect().width);
  new ResizeObserver(([entry]) => render(entry.contentRect.width)).observe(node);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
