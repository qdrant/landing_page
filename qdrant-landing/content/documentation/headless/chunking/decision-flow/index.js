// An exploratory decision map, not an evaluation of a reader's actual pipeline.
// Routes point to the next useful check; every step stays directly selectable.
export const STEPS = [
  {
    id: 1, title: 'Inspect Sources', summary: 'Is the source evidence intact?',
    question: 'Does the extracted source preserve what your questions need?',
    anchor: '#1-inspect-your-documents-and-questions',
    choices: [
      { id: 'intact', label: 'Evidence is intact', action: 'Mark the source passages needed for representative questions. Keep document IDs, versions, and source positions so each chunk can be traced back.', next: 2 },
      { id: 'missing', label: 'Extraction loses evidence', action: 'Repair reading order, tables, or OCR first. If the answer depends on visual relationships that extraction loses, compare page-image retrieval. Then inspect the source again.', next: 1, link: '#when-to-use-vlms-or-text-chunking', linkLabel: 'Compare Text and Visual Retrieval' },
    ],
  },
  {
    id: 2, title: 'Choose Boundaries', summary: 'Do needed facts stay together?',
    question: 'Do the boundaries preserve a complete useful unit?',
    anchor: '#2-choose-meaningful-boundaries',
    choices: [
      { id: 'complete', label: 'Complete entries', action: 'Use complete FAQ pairs, paragraphs, or short sections as a baseline. Keep a procedure with the definitions and conditions it needs.', next: 3 },
      { id: 'split', label: 'Related passages are split', action: 'Group dependent passages, or retain their source relationship for later expansion. Use finer boundaries only where a unit is too long.', next: 3 },
      { id: 'mixed', label: 'Unrelated topics are mixed', action: 'Try structural or recursive boundaries first. If those rules repeatedly miss the distinction, compare semantic or LLM-selected boundaries and their extra ingestion cost.', next: 3 },
    ],
  },
  {
    id: 3, title: 'Set Size and Overlap', summary: 'Do both input budgets fit?',
    question: 'Do final embedding inputs and the assembled answer context fit?',
    anchor: '#3-fit-size-and-overlap-to-your-constraints',
    choices: [
      { id: 'fits', label: 'Both budgets fit', action: 'Keep complete short units short. Count titles and prefixes with the embedding tokenizer; count retrieved and expanded text with the answering tokenizer. Reserve space for instructions, the question, and the answer.', next: 4 },
      { id: 'oversized', label: 'An input is too large', action: 'Split an oversized embedding input at a finer meaningful boundary. For an oversized answer context, retrieve fewer passages or allow more evidence space where possible. Keep conditions intact and recheck both budgets.', next: 3 },
      { id: 'overlap', label: 'Nearby context is missing', action: 'Test carrying the needed sentence or paragraph into the next chunk. Deduplicate repeated source spans. Fetch surrounding source explicitly for distant dependencies.', next: 4 },
    ],
  },
  {
    id: 4, title: 'Add Missing Context', summary: 'Does each chunk make sense alone?',
    question: 'Can a retrieved chunk identify its subject and required conditions?',
    anchor: '#4-add-context-where-needed',
    choices: [
      { id: 'clear', label: 'It stands on its own', action: 'Retain source references for filtering and citations. Test the text that actually reaches the answering model, including any retrieved surroundings.', next: 5 },
      { id: 'identity', label: 'Its subject is unclear', action: 'Include a concise title and section path before embedding, then recheck input length. Payload metadata alone does not change the vector.', next: 3 },
      { id: 'condition', label: 'A condition is missing', action: 'Keep the condition with the indexed passage, or explicitly fetch surrounding source after a useful hit. Bound and deduplicate that expansion, then recheck the answer budget.', next: 3 },
    ],
  },
  {
    id: 5, title: 'Test Final Evidence', summary: 'Where does evidence disappear?',
    question: 'Where does the required evidence disappear in a failed answer?',
    anchor: '#5-test-the-evidence-that-reaches-the-answer',
    choices: [
      { id: 'source', label: 'Source or indexed chunks', action: 'Repair parsing, omitted content, or truncation before testing retrieval again. Changing search cannot recover text that was never indexed.', next: 1 },
      { id: 'search', label: 'Search results', action: 'Inspect the query, filters, and representation. Change boundaries or embedded context when missing meaning explains why a useful passage did not match.', next: 2 },
      { id: 'assembly', label: 'Context assembly', action: 'Check ranking, duplicated spans, source expansion, and the total text budget. Re-splitting may not be necessary.', next: 3, link: '#4-add-context-where-needed', linkLabel: 'Check Context Expansion' },
      { id: 'answer', label: 'Only the answer is wrong', action: 'If the evidence reached the answering model, inspect its prompt and use of that evidence before changing chunking. Keep answer correctness separate from evidence coverage.', next: null },
      { id: 'present', label: 'All evidence arrives', action: 'Score answer correctness and citations separately. Record the configuration and results, and retest previously successful questions after changes. Evidence coverage alone is not an answer-quality result.', next: null },
    ],
  },
];

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function decisionFor(stepId, choiceId) {
  const step = STEPS.find(candidate => candidate.id === stepId);
  const choice = step?.choices.find(candidate => candidate.id === choiceId);
  if (!step || !choice) throw new RangeError('Choose a valid decision and situation.');
  return { step, choice, nextStep: STEPS.find(candidate => candidate.id === choice.next) ?? null };
}

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--flow');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-controls qi-controls--split">
        <p class="qi-chunk__lead">Explore the five decisions. Select a step, then a situation.</p>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <div class="qi-flow__layout">
        <ol class="qi-flow__steps" aria-label="Chunking setup decisions">
          ${STEPS.map((step, index) => `<li>
            <button type="button" class="qi-chip qi-flow__node" data-step="${step.id}" aria-pressed="false" aria-label="Step ${step.id}: ${escape(step.title)}">
              <span class="qi-flow__number" aria-hidden="true">${step.id}</span>
              <span class="qi-flow__node-copy"><b>${escape(step.title)}</b><span>${escape(step.summary)}</span></span>
            </button>
            ${index < STEPS.length - 1 ? '<span class="qi-flow__arrow" aria-hidden="true">↓</span>' : ''}
          </li>`).join('')}
        </ol>
        <div class="qi-chunk__panel qi-flow__detail">
          <p class="qi-frame-label" data-decision-label></p>
          <p class="qi-flow__question" data-question></p>
          <div class="qi-flow__choices" role="group" aria-label="Choose a situation" data-choices></div>
          <div class="qi-flow__action">
            <p class="qi-frame-label">Next Action</p>
            <p data-action></p>
            <div class="qi-flow__navigation">
              <button type="button" class="qi-chip" data-next></button>
              <a data-section>Read This Step</a>
              <a data-related hidden></a>
            </div>
          </div>
        </div>
      </div>
      <p class="qi-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  let activeStep = 1;
  const selections = new Map(STEPS.map(step => [step.id, step.choices[0].id]));
  const choices = node.querySelector('[data-choices]');
  const nextButton = node.querySelector('[data-next]');
  const related = node.querySelector('[data-related]');
  let renderedStep;

  function render() {
    const { step, choice, nextStep } = decisionFor(activeStep, selections.get(activeStep));
    node.querySelectorAll('[data-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.step) === activeStep)));
    node.querySelector('[data-decision-label]').textContent = `Decision ${step.id} · ${step.title}`;
    node.querySelector('[data-question]').textContent = step.question;
    choices.setAttribute('aria-label', `Choose a situation for ${step.title}`);
    if (renderedStep !== activeStep) {
      choices.innerHTML = step.choices.map(option => `<button type="button" class="qi-chip" data-choice="${option.id}" aria-pressed="false">${escape(option.label)}</button>`).join('');
      renderedStep = activeStep;
    }
    choices.querySelectorAll('[data-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.choice === choice.id)));
    node.querySelector('[data-action]').textContent = choice.action;
    node.querySelector('[data-section]').href = step.anchor;
    nextButton.hidden = !nextStep || nextStep.id === step.id;
    nextButton.textContent = nextStep ? `${nextStep.id <= step.id ? 'Return' : 'Continue'} to Step ${nextStep.id} →` : '';
    if (nextStep) nextButton.dataset.destination = nextStep.id;
    else delete nextButton.dataset.destination;
    related.hidden = !choice.link;
    if (choice.link) {
      related.href = choice.link;
      related.textContent = choice.linkLabel;
    } else {
      related.removeAttribute('href');
      related.textContent = '';
    }
    node.querySelector('[role="status"]').textContent = `Step ${step.id}: ${step.title}. Situation: ${choice.label}. ` +
      (nextStep?.id === step.id ? 'Recheck this decision after making the change.' : nextStep ? `Next check: step ${nextStep.id}, ${nextStep.title}.` : 'Evaluate the answering stage and record the result.');
  }

  node.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !node.contains(button)) return;
    let focusStep = false;
    if (button.hasAttribute('data-step')) activeStep = Number(button.dataset.step);
    else if (button.hasAttribute('data-choice')) selections.set(activeStep, button.dataset.choice);
    else if (button.hasAttribute('data-next')) {
      const destination = Number(button.dataset.destination);
      if (!STEPS.some(step => step.id === destination)) return;
      activeStep = destination;
      focusStep = true;
    } else if (button.hasAttribute('data-reset')) {
      activeStep = 1;
      STEPS.forEach(step => selections.set(step.id, step.choices[0].id));
    } else return;
    render();
    if (focusStep) node.querySelector(`[data-step="${activeStep}"]`).focus({ preventScroll: true });
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
