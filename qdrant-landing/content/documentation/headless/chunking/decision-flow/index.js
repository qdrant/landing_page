// Validate text retrieval before optimizing ingestion.
export const STEPS = [
  {
    id: 1,
    title: 'Inspect sources',
    checklist: [
      '**Audit Sources:** Check extracted text against the original. Use OCR for scans and preserve table labels during parsing.',
      '**Map Natural Anchors:** Identify headings, paragraphs, sentences, and references that depend on nearby context.',
    ],
  },
  {
    id: 2,
    title: 'Choose boundary',
    checklist: [
      '**Align With Structure:** Start with paragraphs or sentences, then split oversized passages. Keep statements with their conditions.',
      '**Set Limits & Preserve Context:** Count with the embedding model\'s tokenizer, including added context. Tune chunk size and overlap within its limit.',
    ],
  },
  {
    id: 3,
    title: 'Evaluate chunk quality',
    checklist: [
      '**Fix the Comparison:** Hold documents, questions, models, search settings, and the retrieved-text budget fixed.',
      '**Benchmark & Diagnose:** Measure source-span **recall** and **precision**. Count repeated text and inspect missing conditions.',
    ],
  },
  {
    id: 4,
    title: 'Speed up chunking',
    checklist: [
      '**Profile the Pipeline:** Time parsing, token counting, splitting, embedding, and indexing separately. Optimize the dominant stage.',
      '**Reuse & Scale Processing:** Reuse tokenizers, bound caches, batch model calls, and stream large files. Recheck retrieval quality after changes.',
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
    checklist.innerHTML = step.checklist.map(item => `<li>${escape(item).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`).join('');
    node.querySelector('[role="status"]').textContent = `${step.title}. ${step.checklist.join(' ').replace(/\*\*/g, '')}`;
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
