import { bindFilterForm } from './filter-form';

document.querySelectorAll('.integration-directory').forEach((directory, index) => {
  const form = directory.querySelector('form');
  const query = form.elements.namedItem('q');
  const facets = [...form.querySelectorAll('select[data-facet]')];
  const items = [...directory.querySelectorAll('[data-directory-item]')].map(element => ({
    element,
    search: element.dataset.directorySearch,
    models: JSON.parse(element.dataset.directoryModels).map(model => ({
      ...model,
      text: `${element.dataset.directorySearch} ${model.name.toLowerCase()}`,
    })),
    matches: element.querySelector('[data-directory-matches]'),
  }));
  const count = directory.querySelector('[data-directory-count]');
  const empty = directory.querySelector('[data-directory-empty]');

  function filter() {
    const terms = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    items.forEach(item => {
      const matchesFacets = facets.every(select => !select.value
        || (item.element.getAttribute(`data-facet-${select.dataset.facet}`) || '').split('|').includes(select.value));
      const matchesProvider = terms.every(term => item.search.includes(term));
      const matchingModels = terms.length ? item.models.filter(model => terms.every(term => model.text.includes(term))
        && facets.every(select => !select.value || !model[select.name] || model[select.name].includes(select.value))) : [];
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
  }

  // The first directory keeps short URL params; any later one on the page gets its own prefix.
  bindFilterForm(form, [query, ...facets], filter, { paramPrefix: index ? `d${index}-` : '' });
});
