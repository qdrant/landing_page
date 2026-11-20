// Product and year filters on /roadmap/ and /changelog/. Items carry
// data-product-item (and data-year on the changelog), groups (roadmap stages,
// changelog months) carry data-product-group. A group with a
// data-product-empty message keeps its place and shows the message, a group
// without one is hidden when nothing in it matches. Qdrant and the newest year
// are selected by default; ?product=cloud and ?year=2026 in the URL preselect
// others so a filtered view can be linked to. Each option's count follows the
// selection in the other filter.
(function () {
  const productFilter = document.querySelector('[data-product-filter]');
  if (!productFilter) return;
  const yearFilter = document.querySelector('[data-year-filter]');

  const productOptions = [...productFilter.querySelectorAll('[data-product-option]')];
  const yearOptions = yearFilter ? [...yearFilter.querySelectorAll('[data-year-option]')] : [];
  const items = [...document.querySelectorAll('[data-product-item]')];
  const groups = [...document.querySelectorAll('[data-product-group]')];
  const filterEmpty = document.querySelector('[data-filter-empty]');

  const products = productOptions.map((option) => option.dataset.productOption);
  const years = yearOptions.map((option) => option.dataset.yearOption);
  const defaults = {
    product: products.includes('qdrant') ? 'qdrant' : products[0],
    year: years[0] ?? null,
  };
  const state = { ...defaults };

  const matches = (item, product, year) =>
    item.dataset.productItem === product && (year === null || item.dataset.year === year);

  const select = (options, value, key) => {
    options.forEach((option) => {
      const active = option.dataset[key] === value;
      option.classList.toggle('product-filter__option--active', active);
      option.setAttribute('aria-pressed', String(active));
    });
  };

  const setCount = (option, count) => {
    const badge = option.querySelector('[data-option-count]');
    if (badge) badge.textContent = count;
  };

  const apply = () => {
    select(productOptions, state.product, 'productOption');
    select(yearOptions, state.year, 'yearOption');

    items.forEach((item) => {
      item.hidden = !matches(item, state.product, state.year);
    });
    if (filterEmpty) filterEmpty.hidden = items.some((item) => !item.hidden);

    if (yearFilter) {
      productOptions.forEach((option) => {
        setCount(option, items.filter((item) => matches(item, option.dataset.productOption, state.year)).length);
      });
      yearOptions.forEach((option) => {
        setCount(option, items.filter((item) => matches(item, state.product, option.dataset.yearOption)).length);
      });
    }

    groups.forEach((group) => {
      const visible = group.querySelectorAll('[data-product-item]:not([hidden])').length;
      const count = group.querySelector('[data-product-count]');
      const empty = group.querySelector('[data-product-empty]');

      if (count) count.textContent = visible;
      if (empty) {
        empty.hidden = visible > 0;
      } else {
        group.hidden = visible === 0;
      }
    });
  };

  const update = (key, value) => {
    state[key] = value;
    apply();

    const url = new URL(window.location.href);
    if (value === defaults[key]) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    window.history.replaceState(null, '', url);
  };

  productOptions.forEach((option) => {
    option.addEventListener('click', () => update('product', option.dataset.productOption));
  });
  yearOptions.forEach((option) => {
    option.addEventListener('click', () => update('year', option.dataset.yearOption));
  });

  const params = new URLSearchParams(window.location.search);
  if (products.includes(params.get('product'))) state.product = params.get('product');
  if (years.includes(params.get('year'))) state.year = params.get('year');
  apply();
})();
