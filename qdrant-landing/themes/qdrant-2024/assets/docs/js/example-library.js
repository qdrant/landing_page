import { bindFilterForm } from './filter-form';

const library = document.querySelector('.example-library');
if (library) {
  const form = library.querySelector('form');
  const query = form.elements.namedItem('q');
  const goal = form.elements.namedItem('goal');
  const stack = form.elements.namedItem('stack');
  const mainStacks = new Set([...stack.options].map(option => option.value).filter(value => value && value !== 'other'));
  const cards = [...library.querySelectorAll('[data-example]')];
  const count = library.querySelector('[data-example-count]');
  const empty = library.querySelector('[data-example-empty]');
  const navGoals = [...document.querySelectorAll('[data-example-nav-goal]')];

  function filter() {
    const terms = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach(card => {
      const cardStacks = card.dataset.stack.split('|');
      const matchesStack = !stack.value || (stack.value === 'other'
        ? cardStacks.some(name => !mainStacks.has(name))
        : cardStacks.includes(stack.value));
      const match = (!goal.value || card.dataset.goal === goal.value)
        && matchesStack
        && terms.every(term => card.dataset.search.includes(term));
      card.hidden = !match;
      if (match) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? 'result' : 'results'}`;
    empty.hidden = visible !== 0;
    navGoals.forEach(item => {
      const active = item.dataset.exampleNavGoal === goal.value;
      item.classList.toggle('active', active);
      const link = item.querySelector('a');
      if (active) link.setAttribute('aria-current', goal.value ? 'location' : 'page');
      else link.removeAttribute('aria-current');
    });
  }

  bindFilterForm(form, [query, goal, stack], filter);
}
