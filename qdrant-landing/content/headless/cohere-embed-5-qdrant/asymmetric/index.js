const query = [100, 80, 1, 1, 1, 1, 1, 1];
const pages = { A: [1, 1, -1, -1, -1, -1, -1, -1], B: [-1, -1, 1, 1, 1, 1, 1, 1] };

export function mount(node) {
  node.classList.add('ce5-asymmetric');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-controls">
        <div class="qi-group" role="group" aria-label="Query precision">
          <button type="button" class="qi-chip" data-query="1">1-bit query</button>
          <button type="button" class="qi-chip" data-query="8">8-bit query</button>
        </div>
      </div>
      <div class="ce5-asymmetric__matrix">
        <div class="ce5-asymmetric__row ce5-asymmetric__query" role="img" data-query-row>
          <span>Query</span>
          ${query.map(() => '<span class="ce5-asymmetric__slot"><span data-bar></span></span>').join('')}
        </div>
        <p class="ce5-asymmetric__note">Stored Pages</p>
        ${Object.entries(pages).map(([name, signs]) => `
          <div class="ce5-asymmetric__row" data-page="${name}" role="img" aria-label="Page ${name}: ${signs.map(s => s > 0 ? 'plus' : 'minus').join(', ')}">
            <span>Page ${name}</span>${signs.map((s, i) => `<span class="ce5-asymmetric__sign${s === Math.sign(query[i]) ? ' ce5-asymmetric__sign--match' : ''}">${s > 0 ? '+' : '−'}</span>`).join('')}
          </div>`).join('')}
      </div>
      <p class="qi-status" role="status" aria-live="polite"></p>
    </div>`;

  const buttons = node.querySelectorAll('[data-query]');
  function render(bits) {
    const weights = bits === '1' ? query.map(Math.sign) : query;
    const score = signs => signs.reduce((sum, sign, i) => sum + sign * weights[i], 0);
    const winner = score(pages.A) > score(pages.B) ? 'A' : 'B';
    node.querySelectorAll('[data-bar]').forEach((bar, i) => {
      bar.style.height = `${bits === '1' ? 40 : query[i]}%`;
    });
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.query === bits));
    for (const row of node.querySelectorAll('[data-page]')) row.dataset.winner = String(row.dataset.page === winner);
    node.querySelector('[data-query-row]').setAttribute('aria-label', bits === '1'
      ? 'Query: eight positive signs with equal weight.'
      : 'Query: two strong positive values and six small positive values.');
    node.querySelector('[role="status"]').textContent = bits === '1'
      ? 'Page B wins: six matches outweigh two.'
      : 'Page A wins: two strong matches outweigh six weak ones.';
  }
  for (const button of buttons) button.addEventListener('click', () => render(button.dataset.query));
  render('8');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
