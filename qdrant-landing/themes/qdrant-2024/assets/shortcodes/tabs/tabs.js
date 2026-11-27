(function () {
  const STORAGE_KEY = 'preferred-tab';

  function save(label) {
    try { localStorage.setItem(STORAGE_KEY, label); } catch (_) {}
  }

  function load() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }

  function tabsOf(group) {
    return Array.from(group.querySelectorAll(':scope > .tabs__list > .tabs__tab'));
  }

  function panelsOf(group) {
    return Array.from(group.querySelectorAll(':scope > .tabs__panel'));
  }

  // Show the tab with this label. Groups without such a tab stay as they are.
  // Hidden panels use hidden="until-found" so the browser's find still sees them.
  function select(group, label) {
    const panels = panelsOf(group);
    if (!panels.some((p) => p.dataset.label === label)) return;

    panels.forEach((p) => {
      if (p.dataset.label === label) p.removeAttribute('hidden');
      else p.setAttribute('hidden', 'until-found');
    });
    tabsOf(group).forEach((tab) => {
      const active = tab.dataset.label === label;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
  }

  const groups = Array.from(document.querySelectorAll('.tabs'));

  function choose(label) {
    groups.forEach((g) => select(g, label));
    save(label);
  }

  groups.forEach((group) => {
    const list = group.querySelector(':scope > .tabs__list');

    list.addEventListener('click', (e) => {
      const tab = e.target.closest('.tabs__tab');
      if (tab) choose(tab.dataset.label);
    });

    // Arrow keys, Home, and End move between tabs and select the one reached.
    list.addEventListener('keydown', (e) => {
      const tabs = tabsOf(group);
      const current = tabs.indexOf(document.activeElement);
      if (current === -1) return;

      let next;
      if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;

      e.preventDefault();
      tabs[next].focus();
      choose(tabs[next].dataset.label);
    });

    // A find-in-page match in a hidden tab opens that tab, in this group only.
    panelsOf(group).forEach((panel) => {
      panel.addEventListener('beforematch', () => select(group, panel.dataset.label));
    });
  });

  const saved = load();
  if (saved) groups.forEach((g) => select(g, saved));
})();
