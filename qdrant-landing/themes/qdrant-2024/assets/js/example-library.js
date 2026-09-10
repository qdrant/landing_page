const library = document.querySelector('.example-library');
if (library) {
  const form = library.querySelector('form');
  const query = form.elements.namedItem('q');
  const goal = form.elements.namedItem('goal');
  const stack = form.elements.namedItem('stack');
  const cards = [...library.querySelectorAll('[data-example]')];
  const count = library.querySelector('[data-example-count]');
  const empty = library.querySelector('[data-example-empty]');

  function readURL() {
    const params = new URLSearchParams(window.location.search);
    query.value = params.get('q') || '';
    for (const select of [goal, stack]) {
      const value = params.get(select.name) || '';
      select.value = [...select.options].some(option => option.value === value) ? value : '';
    }
  }

  function filter(updateURL = true) {
    const terms = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach(card => {
      const match = (!goal.value || card.dataset.goal === goal.value)
        && (!stack.value || card.dataset.stack.split('|').includes(stack.value))
        && terms.every(term => card.dataset.search.includes(term));
      card.hidden = !match;
      if (match) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? 'result' : 'results'}`;
    empty.hidden = visible !== 0;
    document.querySelectorAll('[data-example-nav-goal]').forEach(item => {
      const active = item.dataset.exampleNavGoal === goal.value;
      item.classList.toggle('active', active);
      const link = item.querySelector('a');
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (updateURL) {
      const url = new URL(window.location.href);
      for (const control of [query, goal, stack]) {
        const value = control.value.trim();
        if (value) url.searchParams.set(control.name, value);
        else url.searchParams.delete(control.name);
      }
      window.history.replaceState(null, '', url);
    }
  }

  form.hidden = false;
  readURL();
  filter(false);
  form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  form.addEventListener('input', () => filter());
  form.addEventListener('change', () => filter());
  form.addEventListener('reset', () => {
    query.value = goal.value = stack.value = '';
    filter();
  });
  window.addEventListener('popstate', () => { readURL(); filter(false); });
}
