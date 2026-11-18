// Setup checklists cover text, audio, and video ingestion.
export const STEPS = [
  {
    id: 1,
    title: 'Inspect sources',
    checklist: [
      '**Audit Sources:** Catalog text, audio, and video formats. Check token counts, durations, and noise that needs cleaning.',
      '**Map Natural Anchors:** Identify document headers, silence gaps, speaker changes, and scene cuts.',
    ],
  },
  {
    id: 2,
    title: 'Choose boundary',
    checklist: [
      '**Align With Structure:** Split at paragraphs, speaker turns, or scene changes. Use semantic shifts when structural markers are missing.',
      '**Set Limits & Preserve Context:** Set token or time limits and tune overlap. Keep tables, code blocks, complete thoughts, and actions intact.',
    ],
  },
  {
    id: 3,
    title: 'Speed up chunking',
    checklist: [
      '**Use Lightweight Cues:** Start with regex, voice activity detection, or simple scene-change detection before adding expensive models.',
      '**Reuse & Scale Processing:** Cache unchanged assets, batch or parallelize processing, and stream large files.',
    ],
  },
  {
    id: 4,
    title: 'Evaluate chunk quality',
    checklist: [
      '**Check Boundaries & Limits:** Sample chunks for complete sentences and actions. Check that they fit embedding model token or duration limits.',
      '**Benchmark & Diagnose:** Measure **Recall@K** and **MRR** on labeled queries. Trace misses to fragmented context or noisy boundaries.',
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
