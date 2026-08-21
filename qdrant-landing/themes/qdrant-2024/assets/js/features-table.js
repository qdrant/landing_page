document.addEventListener('DOMContentLoaded', function () {
  // Pricing features tabs (Managed / On-Premise)
  function expandPricingTableSections(table) {
    if (!table) return;
    table.querySelectorAll('.features-table__table-section').forEach((section) => {
      const rows = section.querySelector('.features-table__table-section-rows');
      if (!rows) return;
      section.classList.remove('features-table__table-section--collapsed');
      rows.style.maxHeight = rows.scrollHeight + 'px';
    });
  }

  const featuresTabs = document.querySelectorAll('.qdrant-pricing-features__tab');
  const featuresTableWrappers = document.querySelectorAll('[data-features-tab]');
  featuresTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      featuresTabs.forEach((t) => t.classList.remove('qdrant-pricing-features__tab--active'));
      tab.classList.add('qdrant-pricing-features__tab--active');
      const targetTab = tab.dataset.tab;
      featuresTableWrappers.forEach((wrapper) => {
        wrapper.classList.toggle(
          'qdrant-pricing-features__table-wrapper--hidden',
          wrapper.dataset.featuresTab !== targetTab
        );
      });
      const visibleWrapper = document.querySelector(`[data-features-tab="${targetTab}"]`);
      const visibleTable = visibleWrapper?.querySelector('.features-table');
      requestAnimationFrame(() => expandPricingTableSections(visibleTable));
    });
  });

  // Universal features table: mobile tier tabs + section collapse/expand
  document.querySelectorAll('.features-table').forEach((table) => {
    const tierTabs = table.querySelectorAll('.features-table__tier-tab');
    if (tierTabs.length) {
      const prevBtn = table.querySelector('.features-table__tier-arrow--prev');
      const nextBtn = table.querySelector('.features-table__tier-arrow--next');
      let activeIndex = 0;

      const updateMobileTierColumns = (activeTier) => {
        table.querySelectorAll('[data-tier-col]').forEach((col) => {
          col.classList.remove('features-table__table-cell--mobile-active');
        });
        table.querySelectorAll(`[data-tier-col="${activeTier}"]`).forEach((col) => {
          col.classList.add('features-table__table-cell--mobile-active');
        });
      };

      const setActiveTier = (index) => {
        const tab = tierTabs[index];
        if (!tab) return;
        activeIndex = index;
        tierTabs.forEach((t) => t.classList.remove('features-table__tier-tab--active'));
        tab.classList.add('features-table__tier-tab--active');
        updateMobileTierColumns(tab.dataset.tier);
      };

      setActiveTier(0);

      tierTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => setActiveTier(index));
      });

      prevBtn?.addEventListener('click', () => {
        setActiveTier((activeIndex - 1 + tierTabs.length) % tierTabs.length);
      });
      nextBtn?.addEventListener('click', () => {
        setActiveTier((activeIndex + 1) % tierTabs.length);
      });
    }

    const isInHiddenWrapper = table.closest('[data-features-tab]')?.classList.contains('qdrant-pricing-features__table-wrapper--hidden');
    table.querySelectorAll('.features-table__table-section').forEach((section) => {
      const header = section.querySelector('.features-table__table-section-header');
      const rows = section.querySelector('.features-table__table-section-rows');
      if (!header || !rows) return;

      header.addEventListener('click', () => {
        const isCollapsed = section.classList.contains('features-table__table-section--collapsed');
        if (isCollapsed) {
          rows.style.overflow = 'hidden';
          rows.style.maxHeight = rows.scrollHeight + 'px';
          section.classList.remove('features-table__table-section--collapsed');
        } else {
          rows.style.overflow = 'hidden';
          rows.style.maxHeight = rows.scrollHeight + 'px';
          rows.offsetHeight;
          rows.style.maxHeight = '0px';
          section.classList.add('features-table__table-section--collapsed');
        }
      });

      rows.addEventListener('transitionend', () => {
        if (!section.classList.contains('features-table__table-section--collapsed')) {
          rows.style.removeProperty('max-height');
          rows.style.removeProperty('overflow');
        }
      });
    });
  });
});
