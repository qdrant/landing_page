// Illustrative vocabulary: the post only confirms that `hug` and `##s` are in potion-base-2M's.
const VOCAB = ['hug', '##s', 'token', '##izer', 'un', '##hug', '##ged'];
const WORDS = ['hugs', 'tokenizer', 'unhug', 'qzx'];
let instanceId = 0;

// Greedy longest-match-first WordPiece, recording every attempt.
export function trace(word) {
  const attempts = [];
  const tokens = [];
  let start = 0;
  while (start < word.length) {
    let end = word.length;
    let found = null;
    while (end > start) {
      const cand = (start > 0 ? '##' : '') + word.slice(start, end);
      const hit = VOCAB.includes(cand);
      attempts.push({ cand, hit, piece: tokens.length });
      if (hit) { found = cand; break; }
      end -= 1;
    }
    if (!found) return { attempts, tokens: ['[UNK]'] };
    tokens.push(found);
    start = end;
  }
  return { attempts, tokens };
}

export function buildSvg(selected, arrowId) {
  const word = WORDS[selected];
  const { attempts, tokens } = trace(word);
  const chips = WORDS.map((w, i) => `
    <g class="be-word${i === selected ? ' is-selected' : ''}" data-word="${i}" role="button" tabindex="0" aria-pressed="${i === selected}" aria-label="Word ${w}">
      <rect x="${20 + i * 150}" y="20" width="130" height="30" rx="6"/>
      <text x="${85 + i * 150}" y="40" text-anchor="middle">${w}</text>
    </g>`).join('');

  const rows = attempts.map((a, i) => {
    const y = 88 + i * 30;
    return `<g class="be-try is-${(a.piece % 4) + 1}${a.hit ? ' is-hit' : ''}">
      <rect x="20" y="${y}" width="190" height="24" rx="5"/>
      <text class="be-cand" x="32" y="${y + 17}">${a.cand}</text>
      <text class="be-result" x="226" y="${y + 17}">${a.hit ? 'in vocabulary: keep it' : 'not in vocabulary: drop the last character'}</text>
    </g>`;
  }).join('');

  const out = tokens.map((t, i) => `
    <rect class="be-out is-${(i % 4) + 1}${t === '[UNK]' ? ' is-unk' : ''}" x="${20 + i * 110}" y="300" width="100" height="26" rx="5"/>
    <text class="be-out-text" x="${70 + i * 110}" y="318" text-anchor="middle">${t}</text>`).join('');

  const last = attempts.length ? attempts[attempts.length - 1] : null;
  return `<svg class="qi-svg be-svg" viewBox="0 0 760 340" role="img" aria-label="WordPiece on the word ${word}: starting from the whole word, the tokenizer drops the last character until the candidate is in the vocabulary, keeps it as a token, and repeats on the rest with the ## prefix. Result: ${tokens.join(', ')}${last && !last.hit ? ', because no candidate matched' : ''}.">
    ${chips}
    <text class="qi-label" x="20" y="76">Candidates, longest first (the vocabulary is illustrative: ${VOCAB.join(', ')})</text>
    ${rows}
    <text class="qi-title" x="20" y="290">Tokens</text>
    ${out}
  </svg>`;
}

export function mount(node) {
  node.classList.add('be-wordpiece');
  const arrowId = `be-wp-${++instanceId}`;
  let selected = 0;
  const render = () => {
    node.innerHTML = `<div class="qi-fig">${buildSvg(selected, arrowId)}</div>`;
    node.querySelectorAll('.be-word').forEach((g) => {
      const pick = () => { selected = Number(g.dataset.word); render(); node.querySelector(`.be-word[data-word="${selected}"]`)?.focus(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  };
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
