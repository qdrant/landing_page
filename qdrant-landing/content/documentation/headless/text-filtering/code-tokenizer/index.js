/*
 * code-tokenizer island — filter a few code snippets with the `code` tokenizer.
 *
 * A list of editable snippets is shown with the tokens the index stores for
 * each. Every snippet shows whether a `text` or `phrase` match on the query
 * finds it, so different spellings of the same name can be compared side by
 * side.
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

const SNIPPETS = [
  'getUserName(id)',
  'get_user_name(id)',
  'GET_USER_NAME',
  'xhr = new XMLHttpRequest()',
  'let map = HashMap::new();',
  'MAX_BUFFER_SIZE = 1_000_000',
  'sha256(utf8Bytes)',
];
// Size the snippet inputs to fit the longest snippet.
const SNIPPET_SIZE = Math.max(...SNIPPETS.map((s) => s.length));

const QUERIES = [
  { query: 'get user name', mode: 'text' },
  { query: 'getusername', mode: 'text' },
  { query: 'hash map new', mode: 'phrase' },
  { query: 'hashmap new', mode: 'phrase' },
  { query: 'http request', mode: 'phrase' },
  { query: '1000000', mode: 'text' },
];

const esc = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const code = (s) => `<code>${esc(s)}</code>`;
const list = (items) =>
  items.length < 3
    ? items.join(' and ')
    : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
const unique = (items) => [...new Set(items)];

// Match one snippet. `hits` are the indexes of the tokens the match covers.
function match(text, query, mode) {
  const doc = tokenizeDoc(text);
  const all = new Set(doc.map((t) => t.text));
  const subwords = new Set(doc.filter((t) => !t.joined).map((t) => t.text));
  let hits = new Set();
  if (query.length && query.every((q) => all.has(q))) {
    hits =
      mode === 'phrase'
        ? phraseHits(doc, query)
        : new Set(doc.flatMap((t, i) => (query.includes(t.text) ? [i] : [])));
  }
  return { doc, all, subwords, hits, matched: hits.size > 0 };
}

// One line on why the query matches the snippets it does.
function explain(results, query, mode) {
  if (!query.length) return 'Enter a query to filter the snippets.';
  const matched = results.filter((r) => r.matched);

  // Phrase: all tokens are there, but one of them is only a joined token.
  if (mode === 'phrase' && query.length > 1) {
    const blocked = results.find(
      (r) => !r.matched && query.every((q) => r.all.has(q)) && query.some((q) => !r.subwords.has(q)),
    );
    if (blocked) {
      const joined = unique(query.filter((q) => !blocked.subwords.has(q)));
      const what = joined.length === 1 ? 'is a joined token' : 'are joined tokens';
      return `${list(joined.map(code))} ${what}, and a joined token only matches a phrase that consists of that token alone.`;
    }
  }
  // A query token that only matches joined tokens finds camelCase words only.
  const joinedOnly = unique(query.filter((q) => matched.length && matched.every((r) => !r.subwords.has(q))));
  if (joinedOnly.length) {
    const what = joinedOnly.length === 1 ? 'is a joined token' : 'are joined tokens';
    return `${list(joinedOnly.map(code))} ${what}. Joined tokens are only added for camelCase words, so other spellings don't match.`;
  }
  if (!matched.length) {
    const missing = unique(query.filter((q) => results.every((r) => !r.all.has(q))));
    if (missing.length) {
      const what = missing.length === 1 ? 'isn\'t an indexed token' : 'aren\'t indexed tokens';
      return `${list(missing.map(code))} ${what} in any snippet.`;
    }
    return mode === 'phrase'
      ? 'No snippet has the query tokens next to each other, in this order.'
      : 'No snippet has every query token.';
  }
  return mode === 'phrase'
    ? 'Matching snippets have the query tokens next to each other, in this order.'
    : 'Matching snippets have every query token, in any order.';
}

const CHECK =
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7"/></svg>';

export function mount(node) {
  node.classList.add('qi-ct');
  const id = `qi-ct-${Math.random().toString(36).slice(2, 8)}`;
  const state = { ...QUERIES[0], snippets: [...SNIPPETS] };

  const row = (_, i) =>
    `<li class="qi-ct__row">` +
    '<span class="qi-ct__mark"></span>' +
    `<input class="qi-ct__input qi-ct__snippet" type="text" size="${SNIPPET_SIZE}" maxlength="120" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Snippet ${i + 1}">` +
    '<ul class="qi-ct__tokens" aria-label="Indexed tokens"></ul>' +
    '</li>';

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-ct__fields">',
    `    <label class="qi-hint" for="${id}-query">Query</label>`,
    '    <div class="qi-ct__query-row">',
    `      <input id="${id}-query" class="qi-ct__input" type="text" maxlength="120" spellcheck="false" autocomplete="off" autocapitalize="off">`,
    '      <div class="qi-group" role="group" aria-label="Match type">',
    '        <button type="button" class="qi-chip" data-mode="text">text</button>',
    '        <button type="button" class="qi-chip" data-mode="phrase">phrase</button>',
    '      </div>',
    '    </div>',
    '    <span class="qi-hint">Tokens</span>',
    '    <ul class="qi-ct__tokens qi-ct__query" aria-label="Query tokens"></ul>',
    '    <span class="qi-hint qi-ct__top">Try</span>',
    '    <div class="qi-group">',
    QUERIES.map((q, i) => `<button type="button" class="qi-chip" data-query="${i}">${esc(q.query)}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <div class="qi-ct__head">',
    '    <span class="qi-group">',
    '      <span class="qi-hint">Snippets and their indexed tokens</span>',
    '      <button type="button" class="qi-chip qi-ct__reset" hidden>Reset snippets</button>',
    '    </span>',
    '    <span class="qi-hint qi-ct__legend"><span class="qi-ct__key" aria-hidden="true"></span>joined camelCase word</span>',
    '  </div>',
    `  <ul class="qi-ct__rows">${SNIPPETS.map(row).join('')}</ul>`,
    '  <p class="qi-status qi-status--2 qi-ct__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const queryInput = node.querySelector(`#${id}-query`);
  const snippetInputs = [...node.querySelectorAll('.qi-ct__snippet')];
  const resetBtn = node.querySelector('.qi-ct__reset');
  const queryList = node.querySelector('.qi-ct__query');
  const rows = [...node.querySelectorAll('.qi-ct__row')];
  const modeBtns = [...node.querySelectorAll('[data-mode]')];
  const queryBtns = [...node.querySelectorAll('[data-query]')];
  const statusEl = node.querySelector('.qi-ct__status');

  function tokenItems(tokens) {
    if (!tokens.length) {
      const li = document.createElement('li');
      li.className = 'qi-hint qi-ct__empty';
      li.textContent = 'No tokens';
      return [li];
    }
    return tokens.map((t) => {
      const li = document.createElement('li');
      li.className = 'qi-ct__token';
      li.textContent = t.text;
      if (t.joined) li.classList.add('is-joined');
      if (t.hot) li.classList.add('is-hot');
      return li;
    });
  }

  function render() {
    const query = tokenizeQuery(state.query);
    const results = state.snippets.map((text) => match(text, query, state.mode));

    queryList.replaceChildren(...tokenItems(query.map((q) => ({ text: q }))));
    rows.forEach((li, i) => {
      const r = results[i];
      li.classList.toggle('is-match', r.matched);
      const mark = li.querySelector('.qi-ct__mark');
      mark.innerHTML = r.matched ? CHECK : '';
      mark.setAttribute('role', 'img');
      mark.setAttribute('aria-label', r.matched ? 'Match' : 'No match');
      li.querySelector('.qi-ct__tokens').replaceChildren(
        ...tokenItems(r.doc.map((t, j) => ({ ...t, hot: r.hits.has(j) }))),
      );
    });

    const count = results.filter((r) => r.matched).length;
    const lead = query.length ? `<b>${count} of ${results.length} match.</b> ` : '';
    statusEl.innerHTML = lead + explain(results, query, state.mode);

    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    queryBtns.forEach((b) => {
      const q = QUERIES[b.dataset.query];
      b.classList.toggle('is-active', q.query === state.query && q.mode === state.mode);
    });
    resetBtn.hidden = state.snippets.every((s, i) => s === SNIPPETS[i]);
  }

  function showSnippets() {
    snippetInputs.forEach((input, i) => (input.value = state.snippets[i]));
  }

  queryInput.addEventListener('input', () => {
    state.query = queryInput.value;
    render();
  });
  snippetInputs.forEach((input, i) =>
    input.addEventListener('input', () => {
      state.snippets[i] = input.value;
      render();
    }),
  );
  resetBtn.addEventListener('click', () => {
    state.snippets = [...SNIPPETS];
    showSnippets();
    render();
  });
  modeBtns.forEach((b) =>
    b.addEventListener('click', () => {
      state.mode = b.dataset.mode;
      render();
    }),
  );
  queryBtns.forEach((b) =>
    b.addEventListener('click', () => {
      Object.assign(state, QUERIES[b.dataset.query]);
      queryInput.value = state.query;
      render();
    }),
  );

  queryInput.value = state.query;
  showSnippets();
  render();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
