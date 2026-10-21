/*
 * code-tokenizer island — try the `code` tokenizer on your own text.
 *
 * The reader edits a text and a query. The island shows the tokens the index
 * stores for the text, the tokens of the query, and whether a `text` or
 * `phrase` match finds the text.
 *
 * The tokenizer is a port of Qdrant's tokenizers/code.rs with the default
 * processing: lowercasing on, no stopwords, stemming, or length limits.
 * - A word is a run of letters, digits and `_`; everything else separates words.
 * - A word that starts with an ASCII digit is a number: `_` removed, not split.
 * - Other words split on `_` and on case changes, including acronyms.
 * - Documents get each camelCase run once more as a joined token, after all
 *   subwords. Queries are subwords only.
 *
 * Phrase matching: in the index, joined tokens are kept apart from the
 * subwords, so a joined token only matches a one-token phrase. The island
 * matches longer phrases against the subwords alone, which gives the same
 * result.
 *
 * Plain HTML + CSS on the shared island design system (islands.scss).
 */

const UPPER = 0;
const LOWER = 1;
const DIGIT = 2;
const UNDERSCORE = 3;

function charClass(c) {
  if (c >= 'A' && c <= 'Z') return UPPER;
  if (c >= '0' && c <= '9') return DIGIT;
  if (c === '_') return UNDERSCORE;
  if (c.charCodeAt(0) < 128) return LOWER;
  if (c !== c.toLowerCase() && c === c.toUpperCase()) return UPPER;
  if (/\p{N}/u.test(c)) return DIGIT;
  // Caseless letters (CJK and others) count as lowercase.
  return LOWER;
}

// Calls emit(token) for each subword and joined(token) for each camelCase run.
function splitWord(word, emit, joined) {
  if (/^[0-9]/.test(word)) {
    emit(word.replace(/_/g, '').toLowerCase());
    return;
  }
  const chars = Array.from(word);
  const classes = chars.map(charClass);
  const n = chars.length;
  const part = (a, b) => chars.slice(a, b).join('').toLowerCase();

  let start = 0;
  let runStart = 0;
  let isCamel = false;
  let prev = UNDERSCORE;
  for (let i = 0; i < n; i++) {
    const cur = classes[i];
    if (prev === UNDERSCORE && cur === UNDERSCORE) {
      // Skip repeated underscores.
    } else if (cur === UNDERSCORE) {
      emit(part(start, i));
      if (isCamel) joined(part(runStart, i));
    } else if (prev === UNDERSCORE) {
      start = i;
      runStart = i;
      isCamel = false;
    } else {
      let boundary = false;
      if ((prev === LOWER || prev === DIGIT) && cur === UPPER) {
        boundary = true;
      } else if (prev === UPPER && cur === UPPER) {
        // The last capital of an acronym starts the next word (HTTPServer),
        // unless what follows is a plural `s` (getURLs).
        boundary =
          i + 1 < n &&
          classes[i + 1] === LOWER &&
          !(chars[i + 1] === 's' && (i + 2 === n || classes[i + 2] !== LOWER));
      }
      if (boundary) {
        emit(part(start, i));
        start = i;
        isCamel = true;
      }
    }
    prev = cur;
  }
  if (prev !== UNDERSCORE) {
    emit(part(start, n));
    if (isCamel) joined(part(runStart, n));
  }
}

const WORD = /[\p{Alphabetic}\p{N}_]+/gu;

function tokenizeDoc(text) {
  const tokens = [];
  const joined = [];
  for (const m of text.matchAll(WORD)) {
    splitWord(
      m[0],
      (t) => tokens.push({ text: t, joined: false }),
      (t) => joined.push({ text: t, joined: true }),
    );
  }
  return tokens.concat(joined);
}

function tokenizeQuery(text) {
  const tokens = [];
  for (const m of text.matchAll(WORD)) splitWord(m[0], (t) => tokens.push(t), () => {});
  return tokens;
}

// Indexes of the document tokens a phrase match covers, across all occurrences.
function phraseHits(doc, query) {
  const hits = new Set();
  // Joined tokens only match a phrase of one token.
  const stream = query.length === 1 ? doc : doc.filter((t) => !t.joined);
  for (let i = 0; i + query.length <= stream.length; i++) {
    if (query.every((q, j) => stream[i + j].text === q)) {
      for (let j = 0; j < query.length; j++) hits.add(doc.indexOf(stream[i + j]));
    }
  }
  return hits;
}

const EXAMPLES = [
  { label: 'Naming conventions', text: 'name = getUserName(user_id)', query: 'get_user_name', mode: 'text' },
  { label: 'Acronyms', text: 'xhr = new XMLHttpRequest()', query: 'http request', mode: 'phrase' },
  { label: 'Joined token', text: 'let map = HashMap::new();', query: 'hashmap', mode: 'text' },
  { label: 'Joined token in a phrase', text: 'let map = HashMap::new();', query: 'hashmap new', mode: 'phrase' },
  { label: 'Numbers', text: 'MAX_BUFFER_SIZE = 1_000_000', query: 'buffer size 1000000', mode: 'phrase' },
  { label: 'Digits', text: 'digest = sha256(utf8Bytes)', query: 'sha 256', mode: 'text' },
];

const esc = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const code = (s) => `<code>${esc(s)}</code>`;
const list = (items) =>
  items.length < 3
    ? items.join(' and ')
    : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;

function verdict(doc, query, mode, hits) {
  if (!query.length) return 'Type a query to see whether it matches the text.';
  const docTexts = new Set(doc.map((t) => t.text));
  const missing = [...new Set(query.filter((q) => !docTexts.has(q)))];
  if (missing.length) {
    const what = missing.length === 1 ? 'isn\'t an indexed token' : 'aren\'t indexed tokens';
    return `<b>No match:</b> ${list(missing.map(code))} ${what}.`;
  }
  if (mode === 'text') {
    return '<b>Match:</b> every query token is an indexed token.';
  }
  if (hits.size) {
    return query.length === 1
      ? '<b>Match:</b> the query token is an indexed token.'
      : '<b>Match:</b> the query tokens are indexed next to each other, in this order.';
  }
  const subwords = new Set(doc.filter((t) => !t.joined).map((t) => t.text));
  const joinedOnly = [...new Set(query.filter((q) => !subwords.has(q)))];
  if (joinedOnly.length) {
    const what = joinedOnly.length === 1 ? 'is a joined token' : 'are joined tokens';
    return `<b>No match:</b> ${list(joinedOnly.map(code))} ${what}, and a joined token only matches a phrase that consists of that token alone.`;
  }
  return '<b>No match:</b> the query tokens are indexed, but not next to each other in this order.';
}

export function mount(node) {
  node.classList.add('qi-ct');
  const id = `qi-ct-${Math.random().toString(36).slice(2, 8)}`;
  const state = { ...EXAMPLES[0] };

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-group qi-ct__examples">',
    '    <span class="qi-hint">Examples</span>',
    EXAMPLES.map((e, i) => `<button type="button" class="qi-chip" data-example="${i}">${e.label}</button>`).join(''),
    '  </div>',
    '  <div class="qi-ct__fields">',
    `    <label class="qi-hint" for="${id}-text">Text</label>`,
    `    <input id="${id}-text" class="qi-ct__input" type="text" maxlength="200" spellcheck="false" autocomplete="off" autocapitalize="off">`,
    `    <label class="qi-hint" for="${id}-query">Query</label>`,
    `    <input id="${id}-query" class="qi-ct__input" type="text" maxlength="200" spellcheck="false" autocomplete="off" autocapitalize="off">`,
    '    <span class="qi-hint">Match</span>',
    '    <div class="qi-group" role="group" aria-label="Match type">',
    '      <button type="button" class="qi-chip" data-mode="text">text</button>',
    '      <button type="button" class="qi-chip" data-mode="phrase">phrase</button>',
    '    </div>',
    '  </div>',
    '  <div class="qi-ct__out">',
    '    <div class="qi-ct__head">',
    '      <span class="qi-hint">Indexed tokens</span>',
    '      <span class="qi-hint qi-ct__legend"><span class="qi-ct__key" aria-hidden="true"></span>joined camelCase word</span>',
    '    </div>',
    '    <ul class="qi-ct__tokens qi-ct__doc" aria-label="Indexed tokens"></ul>',
    '    <span class="qi-hint">Query tokens</span>',
    '    <ul class="qi-ct__tokens qi-ct__query" aria-label="Query tokens"></ul>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-ct__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const textInput = node.querySelector(`#${id}-text`);
  const queryInput = node.querySelector(`#${id}-query`);
  const exampleBtns = [...node.querySelectorAll('[data-example]')];
  const modeBtns = [...node.querySelectorAll('[data-mode]')];
  const docList = node.querySelector('.qi-ct__doc');
  const queryList = node.querySelector('.qi-ct__query');
  const statusEl = node.querySelector('.qi-ct__status');

  function tokenItems(tokens, empty) {
    if (!tokens.length) {
      const li = document.createElement('li');
      li.className = 'qi-hint qi-ct__empty';
      li.textContent = empty;
      return [li];
    }
    return tokens.map((t) => {
      const li = document.createElement('li');
      li.className = 'qi-ct__token';
      li.textContent = t.text;
      if (t.joined) li.classList.add('is-joined');
      if (t.hot) li.classList.add('is-hot');
      if (t.missing) li.classList.add('is-missing');
      return li;
    });
  }

  function render() {
    const doc = tokenizeDoc(state.text);
    const query = tokenizeQuery(state.query);
    const docTexts = new Set(doc.map((t) => t.text));
    const queryTexts = new Set(query);

    let hits;
    if (!query.length) hits = new Set();
    else if (state.mode === 'phrase') hits = phraseHits(doc, query);
    else hits = new Set(doc.flatMap((t, i) => (queryTexts.has(t.text) ? [i] : [])));

    docList.replaceChildren(
      ...tokenItems(doc.map((t, i) => ({ ...t, hot: hits.has(i) })), 'No tokens'),
    );
    const matched = hits.size > 0 && (state.mode === 'phrase' || query.every((q) => docTexts.has(q)));
    queryList.replaceChildren(
      ...tokenItems(
        query.map((q) => ({ text: q, hot: matched, missing: !docTexts.has(q) })),
        'No tokens',
      ),
    );
    statusEl.innerHTML = verdict(doc, query, state.mode, hits);

    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    exampleBtns.forEach((b) => {
      const e = EXAMPLES[b.dataset.example];
      b.classList.toggle(
        'is-active',
        e.text === state.text && e.query === state.query && e.mode === state.mode,
      );
    });
  }

  function load(example) {
    Object.assign(state, example);
    textInput.value = state.text;
    queryInput.value = state.query;
    render();
  }

  textInput.addEventListener('input', () => {
    state.text = textInput.value;
    render();
  });
  queryInput.addEventListener('input', () => {
    state.query = queryInput.value;
    render();
  });
  modeBtns.forEach((b) =>
    b.addEventListener('click', () => {
      state.mode = b.dataset.mode;
      render();
    }),
  );
  exampleBtns.forEach((b) => b.addEventListener('click', () => load(EXAMPLES[b.dataset.example])));

  load(EXAMPLES[0]);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
