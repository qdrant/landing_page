/* Recorded aggregate counts, not tracked question identities. Dot positions
 * are unit-count slots local to a cell and never move between quadrants. */
const NS = 'http://www.w3.org/2000/svg';
const TOTAL = 99;
const CAPACITY = 67;
// Labels match the diagnosis island's symptom names (same four cases), so a
// reader does not have to remap one figure's wording onto the other's.
const CELLS = [
  { recall: 'Low', faithfulness: 'High', label: 'Low recall, supported answer', narrow: ['Low recall,', 'supported answer'], color: '--qi-muted', frame: '--qi-line' },
  { recall: 'High', faithfulness: 'High', label: 'Both scores meet target', narrow: ['Both scores', 'meet target'], color: '--qi-cat-3' },
  { recall: 'Low', faithfulness: 'Low', label: 'Evidence and support drop', narrow: ['Evidence and', 'support drop'], color: '--qi-cat-2' },
  { recall: 'High', faithfulness: 'Low', label: 'Answer loses support', narrow: ['Answer loses', 'support'], color: '--qi-accent' },
];
const PROMPTS = {
  grounded: {
    label: 'Grounded',
    counts: [21, 67, 5, 6],
    status: 'Grounded: 11 of 99 questions fall below the faithfulness target. Counts compare Grounded → Open-book; dots show Grounded.',
  },
  'open-book': {
    label: 'Open-book',
    counts: [10, 55, 16, 18],
    status: 'Open-book: 34 of 99 questions fall below the faithfulness target, 23 more than Grounded. Retrieval is unchanged.',
  },
};

for (const prompt of Object.values(PROMPTS)) {
  if (prompt.counts.reduce((sum, count) => sum + count, 0) !== TOTAL) {
    throw new Error(`Expected ${TOTAL} scored questions for the ${prompt.label} prompt.`);
  }
}

function element(tag, attributes = {}, text) {
  const result = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes)) result.setAttribute(name, value);
  if (text !== undefined) result.textContent = text;
  return result;
}

function label(parent, x, y, text, className = '', anchor = 'start') {
  const result = element('text', {
    x, y,
    class: `qi-label ${className}`,
    style: `text-anchor: ${anchor}`,
  }, text);
  parent.appendChild(result);
  return result;
}

export function mount(node) {
  node.classList.add('qi-pq');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-controls qi-controls--split">
        <div class="qi-group" role="group" aria-label="Generator prompt">
          <span class="qi-hint">Prompt:</span>
          <button type="button" class="qi-chip" data-prompt="grounded" aria-pressed="false">Grounded</button>
          <button type="button" class="qi-chip" data-prompt="open-book" aria-pressed="true">Open-book</button>
        </div>
        <div class="qi-pq__summary" aria-label="Low faithfulness grows from 11 to 34 of 99 questions, an increase of 23">
          <span>Low faithfulness</span><strong>11 → 34</strong><span class="qi-pq__increase">+23 of 99</span>
        </div>
      </div>
      <svg class="qi-svg" role="img"></svg>
      <div class="qi-pq__status">
        <p class="qi-status" role="status" aria-live="polite" aria-atomic="true"></p>
        <p class="qi-status qi-pq__status-ghost" aria-hidden="true"></p>
      </div>
    </div>`;

  const svg = node.querySelector('svg');
  const status = node.querySelector('.qi-status');
  // An invisible copy of the longest explanation shares the status grid cell,
  // so the cell is always as tall as either state and toggling never moves
  // the article, at any width, without measuring text.
  node.querySelector('.qi-pq__status-ghost').textContent = Object.values(PROMPTS)
    .map((prompt) => prompt.status)
    .reduce((longest, text) => (text.length > longest.length ? text : longest));
  const buttons = [...node.querySelectorAll('button')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 'open-book';
  let layoutWidth = 0;

  function render(animate = false) {
    const width = node.getBoundingClientRect().width || 712;
    const narrow = width < 520;
    const viewWidth = narrow ? width : 712;
    const left = narrow ? 50 : 96;
    const gap = narrow ? 8 : 12;
    const cellWidth = (viewWidth - left - gap - 2) / 2;
    const inset = narrow ? 12 : 16;
    const pitch = narrow ? 9 : 11;
    const radius = narrow ? 2.8 : 3.5;
    const columns = Math.max(1, Math.floor((cellWidth - inset * 2 - radius * 2) / pitch) + 1);
    const dotOffset = narrow ? 114 : 86;
    // Pack the largest recorded cell tightly, keeping geometry stable on toggle.
    const cellHeight = Math.ceil(dotOffset + Math.floor((CAPACITY - 1) / columns) * pitch + radius + 12);
    const top = 62;
    const height = top + cellHeight * 2 + gap + 24;
    const prompt = PROMPTS[selected];
    layoutWidth = width;
    node.classList.toggle('qi-pq--narrow', narrow);
    node.dataset.prompt = selected;
    svg.setAttribute('viewBox', `0 0 ${viewWidth} ${height}`);
    svg.setAttribute('aria-label', `${prompt.label} prompt, ${TOTAL} questions. ` +
      CELLS.map((cell, i) => `${cell.recall} recall and ${cell.faithfulness.toLowerCase()} faithfulness: ${prompt.counts[i]} questions`).join('; ') +
      '. Counts compare Grounded to Open-book: 21 to 10, 67 to 55, 5 to 16, and 6 to 18 in the same quadrant order. Low faithfulness increases from 11 to 34 of 99 questions. Recall target: 0.5. Faithfulness target: 0.8. Each dot represents one question; question identities across prompts were not recorded.');
    svg.replaceChildren();

    label(svg, left + (viewWidth - left) / 2, 18, 'recall@10', 'qi-label--strong', 'middle');
    ['Low < 0.5', 'High ≥ 0.5'].forEach((text, column) => {
      label(svg, left + column * (cellWidth + gap) + cellWidth / 2, 49, text, '', 'middle');
    });
    const axisY = top + (cellHeight * 2 + gap) / 2;
    const axis = label(svg, 16, axisY, 'faithfulness', 'qi-label--strong', 'middle');
    axis.setAttribute('transform', `rotate(-90 16 ${axisY})`);
    ['High ≥ 0.8', 'Low < 0.8'].forEach((text, row) => {
      const y = top + row * (cellHeight + gap) + cellHeight / 2;
      if (narrow) {
        const rowLabel = label(svg, 38, y, text, '', 'middle');
        rowLabel.setAttribute('transform', `rotate(-90 38 ${y})`);
      } else {
        const [name, ...threshold] = text.split(' ');
        label(svg, left - 16, y - 8, name, 'qi-label--strong', 'end');
        label(svg, left - 16, y + 14, threshold.join(' '), '', 'end');
      }
    });

    CELLS.forEach((cell, index) => {
      const x = left + (index % 2) * (cellWidth + gap);
      const y = top + Math.floor(index / 2) * (cellHeight + gap);
      const group = element('g', {
        style: `--pq-color: var(${cell.color}); --pq-frame: var(${cell.frame || cell.color})`,
      });
      svg.appendChild(group);
      group.appendChild(element('rect', {
        class: 'qi-frame qi-pq__cell', x, y, width: cellWidth, height: cellHeight, rx: 6,
      }));
      const lines = narrow ? cell.narrow : [cell.label];
      lines.forEach((text, line) => label(group, x + inset, y + 28 + line * 18, text, 'qi-label--strong qi-pq__diagnosis'));

      const values = element('g', { class: 'qi-pq__values' });
      group.appendChild(values);
      // Keep both prompt counts visible. Only the selected mode gets the large
      // count and dots, so comparison never depends on remembering a prior view.
      const countY = y + (narrow ? 76 : 62);
      const before = PROMPTS.grounded.counts[index];
      const after = PROMPTS['open-book'].counts[index];
      const delta = after - before;
      label(values, x + inset, countY, String(before), `qi-pq__before ${selected === 'grounded' ? 'qi-pq__count' : 'qi-pq__comparison'}`);
      // Narrow offsets clear a 2-digit "before" count (e.g. 21, 67); a single
      // digit left more room, but 38/62 let the arrow glyph touch two digits.
      label(values, x + inset + (narrow ? 46 : 48), countY - 3, '→', 'qi-pq__comparison');
      label(values, x + inset + (narrow ? 72 : 78), countY, String(after), `qi-pq__after ${selected === 'open-book' ? 'qi-pq__count' : 'qi-pq__comparison'}`);
      label(values, narrow ? x + inset : x + cellWidth - inset, narrow ? countY + 22 : countY - 3,
        `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`, 'qi-pq__delta', narrow ? 'start' : 'end');
      const dotTop = y + dotOffset;
      // All cells reserve the same 67 slots in both states. Only populated
      // slots are drawn; no absent question is represented by a ghost dot.
      for (let slot = 0; slot < CAPACITY; slot++) {
        if (slot >= prompt.counts[index]) continue;
        values.appendChild(element('circle', {
          class: 'qi-pq__dot',
          cx: x + inset + radius + (slot % columns) * pitch,
          cy: dotTop + Math.floor(slot / columns) * pitch,
          r: radius,
        }));
      }
      // Replace aggregate marks and fade them in place. No timers or moving
      // marks survive a rapid toggle, and no question correspondence is implied.
      if (animate && !reducedMotion.matches) {
        values.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
      }
    });
    label(svg, left, height - 4, 'Grounded → Open-book · 1 dot = 1 question', 'qi-pq__legend');
    status.textContent = prompt.status;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.prompt === selected)));
  }

  buttons.forEach((button) => button.addEventListener('click', () => {
    if (selected === button.dataset.prompt) return;
    selected = button.dataset.prompt;
    render(true);
  }));

  const observer = new ResizeObserver(() => {
    if (Math.abs(node.getBoundingClientRect().width - layoutWidth) > 0.5) render();
  });
  observer.observe(node);
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
