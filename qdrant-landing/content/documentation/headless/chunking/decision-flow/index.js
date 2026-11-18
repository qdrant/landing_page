// Setup checklists apply to direct text, parsed documents, and page images.
export const STEPS = [
  {
    id: 1,
    title: 'Inspect sources',
    checklist: [
      'Identify the evidence your questions need.',
      'Check source quality and reading order.',
      'Choose direct text, OCR, VLM parsing, or page images.',
      'Retain source IDs and positions.',
    ],
  },
  {
    id: 2,
    title: 'Choose boundary',
    checklist: [
      'Fixed chunking: length limits',
      'Sentence chunking: sentence boundaries',
      'Paragraph chunking: paragraph boundaries',
      'Sliding-window chunking: overlapping spans',
      'Semantic chunking: embedding similarity',
      'Agentic chunking: LLM-selected boundaries',
      'Recursive chunking: ordered separators',
    ],
  },
  {
    id: 3,
    title: 'Speed up chunking',
    checklist: [
      'Time parsing, token counting, splitting, model calls, and indexing.',
      'Reuse tokenizers and cache repeated token counts.',
      'Batch or stream when it improves throughput or memory use.',
      'Compare throughput using matching outputs and settings.',
    ],
  },
  {
    id: 4,
    title: 'Evaluate chunk quality',
    checklist: [
      'Label source evidence for representative questions.',
      'Keep corpus, models, questions, and final evidence budget fixed.',
      'Compare evidence coverage, irrelevant text, and duplicates.',
      'Check answer correctness separately from evidence coverage.',
    ],
  },
];

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--flow');
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
          <ul class="qi-flow__checklist" data-checklist></ul>
        </div>
      </div>
      <p class="qi-flow__announcement" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  function render(step) {
    node.querySelectorAll('[data-step]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.step) === step.id));
    });
    const checklist = node.querySelector('[data-checklist]');
    checklist.setAttribute('aria-label', `Checklist: ${step.title}`);
    checklist.innerHTML = step.checklist.map(item => `<li>${escape(item)}</li>`).join('');
    node.querySelector('[role="status"]').textContent = `${step.title}. ${step.checklist.join(' ')}`;
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
