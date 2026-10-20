import { bindFilterForm } from './filter-form';

document.querySelectorAll('.integration-directory').forEach(directory => {
  const form = directory.querySelector('form');
  const facets = [...form.querySelectorAll('select[data-facet]')];
  const items = [...directory.querySelectorAll('[data-directory-item]')];
  const count = directory.querySelector('[data-directory-count]');
  const empty = directory.querySelector('[data-directory-empty]');

  function filter() {
    let visible = 0;
    items.forEach(item => {
      const match = facets.every(select => !select.value
        || (item.getAttribute(`data-facet-${select.dataset.facet}`) || '').split('|').includes(select.value));
      item.hidden = !match;
      if (match) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? count.dataset.noun : count.dataset.plural}`;
    empty.hidden = visible !== 0;
  }

  bindFilterForm(form, facets, filter);
});
