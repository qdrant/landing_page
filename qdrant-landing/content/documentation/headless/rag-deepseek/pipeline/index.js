// The two question states illustrate the tutorial's local retrieval results.
// This diagram does not call Qdrant or DeepSeek.
const examples = {
  api: {
    label: 'Search API',
    question: 'What tools should I need to use to build a web service using vector embeddings for search?',
    matches: 'FastEmbed · Qdrant · FastAPI',
    answer: 'Use FastEmbed for embeddings, Qdrant for vector search, and FastAPI for the web API.',
    status: 'The retrieved descriptions supply the tools needed to answer this question.',
  },
  store: {
    label: 'Grocery store',
    question: 'Where is the nearest grocery store?',
    matches: 'Docker · Qdrant · FastEmbed',
    answer: 'I don\'t know.',
    status: 'The retrieved descriptions contain no store location, so a grounded answer is "I don\'t know."',
  },
};

export function mount(node) {
  node.classList.add('qi-rag');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-controls">
        <div class="qi-group" aria-label="Example question">
          <span class="qi-hint">Question:</span>
          ${Object.entries(examples).map(([id, example]) => `<button type="button" class="qi-chip" data-question="${id}" aria-pressed="false">${example.label}</button>`).join('')}
        </div>
      </div>
      <div class="qi-rag__diagram" aria-label="FastEmbed, Qdrant, and DeepSeek RAG pipeline">
        <p class="qi-rag__question"></p>
        <div class="qi-rag__steps">
          <section class="qi-rag__step qi-rag__step--embed" aria-label="Embedding">
            <span class="qi-rag__role">EMBED</span>
            <div class="qi-rag__brand"><strong>FastEmbed</strong></div>
            <p>BGE small embeds the question and stored descriptions.</p>
          </section>
          <section class="qi-rag__step qi-rag__step--search" aria-label="Retrieval">
            <span class="qi-rag__role">RETRIEVE</span>
            <div class="qi-rag__brand"><img class="qi-rag__qdrant-logo" src="/img/brand-resources-logos/qdrant-logo-red-black.svg" alt="Qdrant"></div>
            <p class="qi-rag__matches"></p>
          </section>
          <section class="qi-rag__step qi-rag__step--answer" aria-label="Answer generation">
            <span class="qi-rag__role">ANSWER</span>
            <div class="qi-rag__brand"><img class="qi-rag__deepseek-logo" src="/documentation/examples/rag-deepseek/deepseek-mark.svg" alt=""><strong>DeepSeek</strong></div>
            <p class="qi-rag__answer"></p>
          </section>
        </div>
      </div>
      <p class="qi-status qi-rag__status" role="status" aria-live="polite"></p>
    </div>`;

  const buttons = [...node.querySelectorAll('button[data-question]')];
  function render(id) {
    const example = examples[id];
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.question === id)));
    node.querySelector('.qi-rag__question').textContent = example.question;
    node.querySelector('.qi-rag__matches').textContent = example.matches;
    node.querySelector('.qi-rag__answer').textContent = example.answer;
    node.querySelector('.qi-rag__status').textContent = example.status;
  }
  buttons.forEach((button) => button.addEventListener('click', () => render(button.dataset.question)));
  render('api');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
