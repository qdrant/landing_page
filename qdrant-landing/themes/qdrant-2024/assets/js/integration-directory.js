document.querySelectorAll('.integration-directory').forEach(directory => {
  const form = directory.querySelector('form');
  const facets = [...form.querySelectorAll('select[data-facet]')];
  const items = [...directory.querySelectorAll('[data-directory-item]')];
  const count = directory.querySelector('[data-directory-count]');
  const empty = directory.querySelector('[data-directory-empty]');

  function readURL() {
    const params = new URLSearchParams(window.location.search);
    facets.forEach(select => {
      const value = params.get(select.name) || '';
      select.value = [...select.options].some(option => option.value === value) ? value : '';
    });
  }

  function filter(updateURL = true) {
    let visible = 0;
    items.forEach(item => {
      const match = facets.every(select => !select.value
        || (item.getAttribute(`data-facet-${select.dataset.facet}`) || '').split('|').includes(select.value));
      item.hidden = !match;
      if (match) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? count.dataset.noun : count.dataset.plural}`;
    empty.hidden = visible !== 0;
    if (updateURL) {
      const url = new URL(window.location.href);
      facets.forEach(select => {
        if (select.value) url.searchParams.set(select.name, select.value);
        else url.searchParams.delete(select.name);
      });
      window.history.replaceState(null, '', url);
    }
  }

  form.hidden = false;
  readURL();
  filter(false);
  form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  form.addEventListener('change', () => filter());
  form.addEventListener('reset', event => {
    event.preventDefault();
    facets.forEach(select => { select.value = ''; });
    filter();
  });
  window.addEventListener('popstate', () => { readURL(); filter(false); });
});
