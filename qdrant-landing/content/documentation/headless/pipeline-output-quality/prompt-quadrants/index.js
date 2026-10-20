/* Recorded aggregate counts, not tracked question identities. Dot positions
 * are unit-count slots local to a cell and never move between quadrants. */
const NS = 'http://www.w3.org/2000/svg';
const TOTAL = 99;
const CAPACITY = 67;
const CELLS = [
  { recall: 'Low', faithfulness: 'High', label: 'Check the labels', narrow: ['Check the labels'], color: '--qi-muted', frame: '--qi-line' },
  { recall: 'High', faithfulness: 'High', label: 'Answer stays in the passages', narrow: ['Answer stays in', 'the passages'], color: '--qi-cat-3' },
  { recall: 'Low', faithfulness: 'Low', label: 'Inspect retrieval first', narrow: ['Inspect retrieval', 'first'], color: '--qi-cat-2' },
  { recall: 'High', faithfulness: 'Low', label: 'Generation problem', narrow: ['Generation', 'problem'], color: '--qi-accent' },
];
const PROMPTS = {
  grounded: {
    label: 'Grounded',
    counts: [21, 67, 5, 6],
    status: 'Grounded prompt: 67 of 99 questions meet both targets, and 6 have High recall but Low faithfulness.',
  },
  'open-book': {
    label: 'Open-book',
    counts: [10, 55, 16, 18],
    status: 'Open-book prompt: High recall, Low faithfulness grows from 6 to 18 of 99, and Low recall, Low faithfulness from 5 to 16. Retrieval did not change, so the shift comes from generation.',
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
      <div class="qi-controls">
        <div class="qi-group" role="group" aria-label="Generator prompt">
          <span class="qi-hint">Prompt:</span>
          <button type="button" class="qi-chip" data-prompt="grounded" aria-pressed="true">Grounded</button>
          <button type="button" class="qi-chip" data-prompt="open-book" aria-pressed="false">Open-book</button>
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
  let selected = 'grounded';
  let layoutWidth = 0;

  function render(animate = false) {
    const width = node.getBoundingClientRect().width || 712;
    const narrow = width < 520;
    const viewWidth = narrow ? width : 712;
    const left = narrow ? 50 : 108;
    const gap = narrow ? 8 : 12;
    const cellWidth = (viewWidth - left - gap - 2) / 2;
    const cellHeight = narrow ? 206 : 166;
    const top = 70;
    const height = top + cellHeight * 2 + gap + 30;
    const inset = narrow ? 12 : 18;
    const prompt = PROMPTS[selected];
    layoutWidth = width;
    node.classList.toggle('qi-pq--narrow', narrow);
    svg.setAttribute('viewBox', `0 0 ${viewWidth} ${height}`);
    svg.setAttribute('aria-label', `${prompt.label} prompt, ${TOTAL} questions. ` +
      CELLS.map((cell, i) => `${cell.recall} recall and ${cell.faithfulness.toLowerCase()} faithfulness: ${prompt.counts[i]} questions`).join('; ') +
      '. Recall target: 0.5. Faithfulness target: 0.8. Each dot represents one question; question identities across prompts were not recorded.');
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
      // Counts sit under the tallest diagnosis label in the layout, so they
      // line up across cells. Tspans keep "of 99" after the number without
      // measuring text, which is unreliable before the web font loads.
      const countY = y + (narrow ? 83 : 80);
      const count = label(values, x + inset, countY, '');
      count.append(element('tspan', { class: 'qi-pq__count' }, String(prompt.counts[index])));
      count.append(element('tspan', { dx: 8 }, 'of 99'));
      if (selected === 'open-book') {
        const was = `was ${PROMPTS.grounded.counts[index]}`;
        if (narrow) label(values, x + inset, countY + 20, was);
        else count.append(element('tspan', { dx: 8 }, `· ${was}`));
      }

      const columns = narrow ? 10 : 17;
      const pitch = narrow ? 12 : 15;
      const radius = narrow ? 3.5 : 4;
      const dotTop = y + (narrow ? 118 : 102);
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
    label(svg, left, height - 5, '1 dot = 1 question');
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
