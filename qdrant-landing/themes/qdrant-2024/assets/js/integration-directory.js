document.querySelectorAll('.integration-directory').forEach(directory => {
  const form = directory.querySelector('form');
  const query = form.elements.namedItem('q');
  const facets = [...form.querySelectorAll('select[data-facet]')];
  const controls = [query, ...facets];
  const items = [...directory.querySelectorAll('[data-directory-item]')].map(element => ({
    element,
    search: element.dataset.directorySearch,
    models: JSON.parse(element.dataset.directoryModels),
    matches: element.querySelector('[data-directory-matches]'),
  }));
  const count = directory.querySelector('[data-directory-count]');
  const empty = directory.querySelector('[data-directory-empty]');

  function readURL() {
    const params = new URLSearchParams(window.location.search);
    controls.forEach(control => {
      const value = params.get(control.name) || '';
      control.value = control.tagName !== 'SELECT'
        || [...control.options].some(option => option.value === value) ? value : '';
    });
  }

  function filter(updateURL = true) {
    const terms = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    items.forEach(item => {
      const matchesFacets = facets.every(select => !select.value
        || (item.element.getAttribute(`data-facet-${select.dataset.facet}`) || '').split('|').includes(select.value));
      const matchesProvider = terms.every(term => item.search.includes(term));
      const matchingModels = terms.length ? item.models.filter(model => {
        const text = `${item.search} ${model.name.toLowerCase()}`;
        return terms.every(term => text.includes(term))
          && facets.every(select => !select.value || !model[select.name] || model[select.name].includes(select.value));
      }) : [];
      const match = matchesFacets && (matchesProvider || matchingModels.length > 0);
      item.element.hidden = !match;
      item.matches.hidden = !match || matchesProvider || matchingModels.length === 0;
      const names = matchingModels.slice(0, 3).map(model => model.name).join(', ');
      const more = matchingModels.length > 3 ? `, and ${matchingModels.length - 3} more` : '';
      item.matches.textContent = item.matches.hidden ? '' : `Matching models: ${names}${more}`;
      if (match) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? count.dataset.noun : count.dataset.plural}`;
    empty.hidden = visible !== 0;
    if (updateURL) {
      const url = new URL(window.location.href);
      controls.forEach(control => {
        const value = control.value.trim();
        if (value) url.searchParams.set(control.name, value);
        else url.searchParams.delete(control.name);
      });
      window.history.replaceState(null, '', url);
    }
  }

  form.hidden = false;
  readURL();
  filter(false);
  form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  query.addEventListener('input', () => filter());
  form.addEventListener('change', event => { if (event.target.tagName === 'SELECT') filter(); });
  form.addEventListener('reset', event => {
    event.preventDefault();
    controls.forEach(control => { control.value = ''; });
    filter();
  });
  window.addEventListener('popstate', () => { readURL(); filter(false); });
});
