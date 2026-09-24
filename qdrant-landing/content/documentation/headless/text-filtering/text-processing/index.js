/*
 * text-processing island — interactive replacement for text-processing.png.
 *
 * Illustrates how a full-text index turns a sentence into tokens. The sentence
 * is always tokenized; the optional steps (ASCII folding, lowercasing, stopword
 * removal, stemming) can be toggled and are applied in that order, matching
 * Qdrant's tokens processor. The resulting tokens are listed alphabetically.
 *
 * The sample sentence is fixed, so the language-specific parts (the English
 * stopword list and the Snowball stemmer output) are hardcoded lookups.
 *
 * Plain HTML + CSS on the shared island design system (islands.scss).
 */

const SENTENCE = 'The café owners are hiring experienced baristas.';
const WORDS = ['The', 'café', 'owners', 'are', 'hiring', 'experienced', 'baristas'];

// The subset of the English stopword list that occurs in the sentence. The list
// is lowercase, so without lowercasing "The" is not a stopword.
const STOPWORDS = new Set(['the', 'are']);
const FOLDED = { café: 'cafe' };
// English Snowball stemmer output. Words not listed stem to themselves.
const STEMS = { owners: 'owner', hiring: 'hire', experienced: 'experienc', baristas: 'barista' };

const STEPS = [
  {
    id: 'folding',
    label: 'ASCII folding',
    on: 'ASCII folding removes diacritics, so <code>café</code> matches <code>cafe</code>.',
    off: 'Without ASCII folding, <code>café</code> keeps its accent.',
  },
  {
    id: 'lowercase',
    label: 'Lowercase',
    on: 'Lowercasing turns <code>The</code> into <code>the</code>, so matching is case-insensitive.',
    off: 'Without lowercasing, words like <code>The</code> keep their capitalization, so matching is case-sensitive.',
  },
  {
    id: 'stopwords',
    label: 'Remove stopwords',
    on: (s) =>
      s.lowercase
        ? 'Stopword removal drops the common words <code>the</code> and <code>are</code>.'
        : 'Stopword removal drops <code>are</code>. <code>The</code> stays, because it isn\'t lowercased.',
    off: 'Common words like <code>the</code> and <code>are</code> are kept as tokens.',
  },
  {
    id: 'stemming',
    label: 'Stemming',
    on: 'Stemming reduces words to their root: <code>hiring</code> becomes <code>hire</code>.',
    off: 'Without stemming, words like <code>hiring</code> are not reduced to their root form <code>hire</code>.',
  },
];

function process(state) {
  const tokens = [];
  WORDS.forEach((word, i) => {
    let t = word;
    if (state.folding) t = FOLDED[t] || t;
    if (state.lowercase) t = t.toLowerCase();
    if (state.stopwords && STOPWORDS.has(t)) return;
    if (state.stemming) t = STEMS[t] || t;
    tokens.push({ id: i, text: t });
  });
  return tokens.sort((a, b) => a.text.localeCompare(b.text, 'en'));
}

export function mount(node) {
  node.classList.add('qi-tx');

  const state = { lowercase: true, stopwords: false, folding: false, stemming: false };

  const arrow =
    '<svg class="qi-tx__arrow" width="24" height="14" viewBox="0 0 24 14" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h21M16 1l6 6-6 6"/></svg>';

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-tx__flow">',
    '    <div class="qi-tx__col">',
    '      <span class="qi-hint">Input text</span>',
    `      <div class="qi-tx__sentence">${SENTENCE}</div>`,
    '    </div>',
    arrow,
    '    <fieldset class="qi-tx__col qi-tx__steps">',
    '      <legend class="qi-hint">Text processing</legend>',
    STEPS.map(
      (s, i) =>
        `<label class="qi-chip qi-tx__opt" data-step="${s.id}">` +
        `<input type="checkbox" class="qi-tx__check" value="${s.id}">` +
        `<span class="qi-tx__num">${i + 1}</span>${s.label}</label>`,
    ).join(''),
    '    </fieldset>',
    arrow,
    '    <div class="qi-tx__col">',
    '      <span class="qi-hint qi-tx__count"></span>',
    '      <ul class="qi-tx__tokens" aria-label="Resulting tokens, in alphabetical order"></ul>',
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-tx__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const opts = [...node.querySelectorAll('.qi-tx__opt')];
  const list = node.querySelector('.qi-tx__tokens');
  const countEl = node.querySelector('.qi-tx__count');
  const statusEl = node.querySelector('.qi-tx__status');

  let previous = {};

  function render(changedStep) {
    opts.forEach((opt) => {
      const on = state[opt.dataset.step];
      opt.querySelector('input').checked = on;
      opt.classList.toggle('is-active', on);
    });

    const tokens = process(state);
    list.replaceChildren(
      ...tokens.map((t) => {
        const li = document.createElement('li');
        li.className = 'qi-tx__token';
        li.textContent = t.text;
        // Flash the tokens the last toggle changed.
        if (changedStep && previous[t.id] !== t.text) li.classList.add('is-changed');
        return li;
      }),
    );
    previous = {};
    tokens.forEach((t) => (previous[t.id] = t.text));
    countEl.textContent = `Tokens (${tokens.length}, A–Z)`;

    if (!changedStep) {
      statusEl.innerHTML = 'Qdrant tokenizes text and applies different processing steps to the resulting tokens. Toggle a step to see how it changes the tokens.';
      return;
    }
    const step = STEPS.find((s) => s.id === changedStep);
    const msg = state[changedStep] ? step.on : step.off;
    statusEl.innerHTML = typeof msg === 'function' ? msg(state) : msg;
  }

  opts.forEach((opt) => {
    opt.querySelector('input').addEventListener('change', (e) => {
      state[opt.dataset.step] = e.target.checked;
      render(opt.dataset.step);
    });
  });

  render(null);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
