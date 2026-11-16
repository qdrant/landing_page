import { bindFilterForm } from './filter-form';

const directory = document.querySelector('.guide-directory');
if (directory) {
  const form = directory.querySelector('form');
  const query = form.elements.namedItem('q');
  const guides = [...directory.querySelectorAll('[data-guide]')];
  const topics = [...directory.querySelectorAll('[data-guide-topic]')];
  const count = directory.querySelector('[data-guide-count]');
  const empty = directory.querySelector('[data-guide-empty]');

  function filter() {
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
  }

  count.hidden = false;
  bindFilterForm(form, [query], filter);
}
