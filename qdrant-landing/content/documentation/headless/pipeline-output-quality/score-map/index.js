// Each score connects only the two artifacts it reads. Components use rounded,
// filled boxes; artifacts use square outlines.
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

function box(parent, x, y, width, title, subtitle, height = 56) {
  parent.append(element('rect', {
    x, y, width, height, rx: subtitle ? 9 : 0,
    class: subtitle ? 'qi-sm__component' : 'qi-sm__artifact',
  }));
  label(parent, x + width / 2, y + height / 2 + (subtitle ? -5 : 6), title, 'qi-label--strong qi-sm__box-label', 'middle');
  if (subtitle) label(parent, x + width / 2, y + height / 2 + 16, subtitle, 'qi-sm__gloss', 'middle');
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
  // Every label keeps at least 10 px of clearance from every line: glosses
  // sit above their own bracket's run, and the retrieval runs stay above the
  // Golden set frame instead of sliding along its top edge.
  label(svg, 16, 22, 'Answer scores', 'qi-sm__heading');
  metric(svg, 350, 50, 'answer_relevancy', 'addresses the question', 'answer');
  path(svg, 'M 58 176 V 88 H 654 V 176', 'answer');
  metric(svg, 490, 112, 'faithfulness', 'claims the passages support', 'answer');
  path(svg, 'M 350 176 V 150 H 632 V 176', 'answer');

  const boxes = [
    [16, 88, 'Question'], [136, 104, 'Qdrant', 'retrieval'],
    [262, 184, 'Top 10 passages'], [468, 112, 'Generator', 'LLM + prompt'],
    [620, 76, 'Answer'],
  ];
  boxes.forEach(([x, width, title, subtitle], index) => {
    box(svg, x, 176, width, title, subtitle);
    if (index < boxes.length - 1) path(svg, `M ${x + width} 204 H ${boxes[index + 1][0]}`, 'pipeline', arrow);
  });

  label(svg, 16, 258, 'Retrieval scores', 'qi-sm__heading');
  metric(svg, 174, 282, 'recall@10', 'labeled passages found, no judge', 'retrieval');
  metric(svg, 538, 282, 'context_precision', 'supporting passages ranked first', 'retrieval');
  goldenFrame(svg, 32, 332, 648, 104);
  path(svg, 'M 323 232 V 318 H 174 V 372', 'retrieval');
  path(svg, 'M 385 232 V 318 H 538 V 372', 'retrieval');
  box(svg, 64, 372, 220, 'Relevance labels', undefined, 50);
  box(svg, 428, 372, 220, 'Reference answer', undefined, 50);
}

function narrow(svg, arrow) {
  label(svg, 16, 26, 'Answer scores', 'qi-sm__heading');
  // Left-side answer brackets are nested; the vertical pipeline stays intact.
  path(svg, 'M 166 77 H 12 V 406 H 166', 'answer');
  path(svg, 'M 166 233 H 34 V 390 H 166', 'answer');
  metric(svg, 24, 116, 'answer_relevancy', ['addresses', 'the question'], 'answer', 'start');
  metric(svg, 46, 278, 'faithfulness', ['claims the', 'passages support'], 'answer', 'start');

  const boxes = [
    [52, 'Question'], [130, 'Qdrant', 'retrieval'], [208, 'Top 10 passages'],
    [286, 'Generator', 'LLM + prompt'], [364, 'Answer'],
  ];
  boxes.forEach(([y, title, subtitle], index) => {
    box(svg, 166, y, 144, title, subtitle, 50);
    if (index < boxes.length - 1) path(svg, `M 238 ${y + 50} V ${boxes[index + 1][0]}`, 'pipeline', arrow);
  });

  label(svg, 16, 438, 'Retrieval scores', 'qi-sm__heading');
  goldenFrame(svg, 24, 444, 300, 248);
  // Separate right-side lanes keep retrieval comparisons clear of the answer
  // brackets. The longer comparison leaves first, outside the shorter lane.
  path(svg, 'M 310 244 H 332 V 553 H 310', 'retrieval');
  path(svg, 'M 310 222 H 344 V 653 H 310', 'retrieval');
  metric(svg, 44, 494, 'recall@10', 'labeled passages found, no judge', 'retrieval', 'start');
  metric(svg, 44, 594, 'context_precision', 'supporting passages ranked first', 'retrieval', 'start');
  box(svg, 44, 528, 266, 'Relevance labels', undefined, 50);
  box(svg, 44, 628, 266, 'Reference answer', undefined, 50);
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
      viewBox: small ? '0 0 350 704' : '0 0 712 440',
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
