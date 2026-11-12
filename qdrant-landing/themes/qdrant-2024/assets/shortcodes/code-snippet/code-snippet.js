(function () {
  const STORAGE_KEY = 'preferred-deployment';

  function save(type) {
    try { localStorage.setItem(STORAGE_KEY, type); } catch (_) {}
  }

  function load() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }

  function switchDeployment(group, requestedType) {
    let target =
      group.querySelector(`.snippet-variant[data-deployment="${requestedType}"]`) ||
      group.querySelector('.snippet-variant[data-deployment="server"]') ||
      group.querySelector('.snippet-variant');
    if (!target) return;

    const actualType = target.dataset.deployment;

    group.querySelectorAll('.snippet-variant').forEach((v) => {
      v.hidden = v !== target;
    });

    const strip = group.querySelector('.deployment-strip');
    if (strip) {
      strip.querySelectorAll('.deployment-strip__btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.deployment === actualType);
      });
    }
  }

  const allGroups = Array.from(document.querySelectorAll('.snippet-group'));

  allGroups.forEach((group) => {
    const strip = group.querySelector('.deployment-strip');
    if (!strip) return;

    strip.addEventListener('click', (e) => {
      const btn = e.target.closest('.deployment-strip__btn');
      if (!btn || !btn.dataset.deployment) return;

      const type = btn.dataset.deployment;
      switchDeployment(group, type);
      save(type);

      allGroups.forEach((g) => {
        if (g !== group) switchDeployment(g, type);
      });
    });
  });

  // Restore stored preference on page load
  const saved = load();
  if (saved) {
    allGroups.forEach((g) => switchDeployment(g, saved));
  }

  // The docs product selector (assets/docs/js/product.js) drives the
  // snippets one way: choosing a product switches every snippet to that
  // deployment when it exists, while choosing a snippet tab never changes
  // the product. A product from the ?product= URL parameter applies on load
  // without being saved.
  const root = document.documentElement;
  if (root.getAttribute('data-product-source') === 'url') {
    const product = root.getAttribute('data-product');
    allGroups.forEach((g) => switchDeployment(g, product));
  }

  document.addEventListener('product:change', (e) => {
    const { product, persist } = e.detail || {};
    if (!product) return;
    allGroups.forEach((g) => switchDeployment(g, product));
    if (persist) save(product);
  });
}).call(this);
