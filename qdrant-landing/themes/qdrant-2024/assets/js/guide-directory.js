const directory = document.querySelector('.guide-directory');
if (directory) {
  const form = directory.querySelector('form');
  const query = form.elements.namedItem('q');
  const guides = [...directory.querySelectorAll('[data-guide]')];
  const topics = [...directory.querySelectorAll('[data-guide-topic]')];
  const count = directory.querySelector('[data-guide-count]');
  const empty = directory.querySelector('[data-guide-empty]');

  function filter(updateURL = true) {
    const terms = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    guides.forEach(guide => {
      guide.hidden = !terms.every(term => guide.dataset.search.includes(term));
      if (!guide.hidden) visible += 1;
    });
    topics.forEach(topic => {
      topic.hidden = !topic.querySelector('[data-guide]:not([hidden])');
    });
    count.textContent = `${visible} ${visible === 1 ? 'guide' : 'guides'}`;
    empty.hidden = visible !== 0;
    if (updateURL) {
      const url = new URL(window.location.href);
      if (query.value.trim()) url.searchParams.set('q', query.value.trim());
      else url.searchParams.delete('q');
      window.history.replaceState(null, '', url);
    }
  }

  function readURL() {
    query.value = new URLSearchParams(window.location.search).get('q') || '';
    filter(false);
  }

  form.hidden = count.hidden = false;
  readURL();
  form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  query.addEventListener('input', () => filter());
  form.addEventListener('reset', event => {
    event.preventDefault();
    query.value = '';
    filter();
    query.focus();
  });
  window.addEventListener('popstate', readURL);
}
