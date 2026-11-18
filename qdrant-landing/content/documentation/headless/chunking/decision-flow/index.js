// Setup checklists cover text, audio, and video ingestion.
export const STEPS = [
  {
    id: 1,
    title: 'Inspect sources',
    checklist: [
      '**Audit Modalities:** Catalog input formats across text (PDF, Markdown), audio (WAV, MP3), and video (MP4, MKV).',
      '**Map Natural Anchors:** Identify existing boundaries like document headers, audio silence gaps, speaker changes, or video scene cuts.',
      '**Measure Scale Distributions:** Check token counts, audio durations, and video frame rates to spot extreme outliers.',
      '**Flag Artifacts & Noise:** Detect OCR errors, background static, dead air, or black frames that require pre-cleaning.',
    ],
  },
  {
    id: 2,
    title: 'Choose boundary',
    checklist: [
      '**Align With Structure:** Split on structural markers first (paragraphs, speaker diarization turns, or visual shot transitions) rather than arbitrary fixed cuts.',
      '**Set Window & Overlap:** Define target limits (tokens or seconds) and add a 10%–20% overlap buffer so context is not lost mid-sentence or mid-action.',
      '**Use Semantic Shifts:** Group consecutive units based on embedding similarity or topic shifts when explicit structural markers are missing.',
      '**Protect Atomic Units:** Keep tables, code blocks, complete spoken thoughts, and continuous visual actions intact.',
    ],
  },
  {
    id: 3,
    title: 'Speed up chunking',
    checklist: [
      '**Leverage Lightweight Heuristics:** Prioritize fast rule-based cues (regex, Voice Activity Detection, pixel histograms) over heavy neural models during initial splitting.',
      '**Batch & Parallelize:** Distribute file processing across multi-core CPU workers or GPU batches for high-throughput ingestion.',
      '**Stream Large Media:** Process long audio tracks and high-resolution videos in memory-mapped streams rather than loading full files at once.',
      '**Cache via Content Hashes:** Store intermediate transcripts, timestamps, and chunk outputs to skip reprocessing unchanged assets.',
    ],
  },
  {
    id: 4,
    title: 'Evaluate chunk quality',
    checklist: [
      '**Audit Boundary Integrity:** Spot-check random samples to confirm sentences are not cut off and video/audio clips start and end cleanly.',
      '**Verify Size Compliance:** Check distribution plots to ensure chunks fit within downstream embedding model token or duration limits.',
      '**Benchmark Retrieval Accuracy:** Measure **Recall@K** and **MRR** against a ground-truth query dataset across all modalities.',
      '**Inspect Failure Modes:** Trace missed retrievals back to fragmented context or noisy boundaries to tune overlap and split thresholds.',
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
