// One illustrative example per setup decision; no pipeline or model runs here.
export const STEPS = [
  {
    id: 1,
    title: 'Inspect sources',
    exampleTitle: 'Receipt totals',
    instruction: 'Check OCR against the original receipt.',
    before: 'Subtotal $70 + tax $17.50 − discount $0.50',
    after: 'Total $87',
  },
  {
    id: 2,
    title: 'Choose boundary',
    exampleTitle: 'Export instructions',
    instruction: 'Keep a task and its condition together.',
    before: 'Export steps + linked-file exception',
    after: 'One chunk',
  },
  {
    id: 3,
    title: 'Set size and overlap',
    exampleTitle: 'Overlapping windows',
    instruction: "Example sizes: count with your embedding model's tokenizer.",
    before: '400-token window − 40-token overlap',
    after: '360-token stride',
  },
  {
    id: 4,
    title: 'Add missing context',
    exampleTitle: 'Name the subject',
    instruction: 'Include useful context before embedding.',
    before: 'Download them separately.',
    after: 'Linked files: download them separately.',
  },
  {
    id: 5,
    title: 'Test final evidence',
    exampleTitle: 'Missing evidence',
    instruction: 'Check the context sent to the answering model.',
    before: 'Retrieved: Share the export archive.',
    after: 'Missing: Download linked files separately.',
  },
];

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--flow', 'mathjax_ignore');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-flow__layout">
        <ol class="qi-flow__steps" aria-label="Chunking setup decisions">
          ${STEPS.map((step, index) => `<li>
            <button type="button" class="qi-chip qi-flow__node" data-step="${step.id}" aria-pressed="false" aria-label="Step ${step.id}: ${escape(step.title)}">
              <b>${escape(step.title)}</b>
            </button>
            ${index < STEPS.length - 1 ? '<span class="qi-flow__arrow" aria-hidden="true">↓</span>' : ''}
          </li>`).join('')}
        </ol>
        <div class="qi-chunk__panel qi-flow__detail">
          <p class="qi-flow__example-title" data-example-title></p>
          <p data-instruction></p>
          <div class="qi-flow__example">
            <p data-before></p>
            <span class="qi-flow__example-arrow" aria-hidden="true">↓</span>
            <p class="qi-flow__result" data-after></p>
          </div>
        </div>
      </div>
      <p class="qi-flow__announcement" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  function render(step) {
    node.querySelectorAll('[data-step]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.step) === step.id));
    });
    node.querySelector('[data-example-title]').textContent = step.exampleTitle;
    node.querySelector('[data-instruction]').textContent = step.instruction;
    node.querySelector('[data-before]').textContent = step.before;
    node.querySelector('[data-after]').textContent = step.after;
    node.querySelector('[role="status"]').textContent = `${step.title}. ${step.instruction} ${step.before} ${step.after}`;
  }

  node.addEventListener('click', event => {
    const button = event.target.closest('button[data-step]');
    if (!button || !node.contains(button)) return;
    const step = STEPS.find(candidate => candidate.id === Number(button.dataset.step));
    if (step) render(step);
  });

  render(STEPS[0]);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
