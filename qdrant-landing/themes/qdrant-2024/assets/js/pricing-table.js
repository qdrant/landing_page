document.addEventListener('DOMContentLoaded', function () {
  // Pricing features tabs (Managed / On-Premise)
  function expandPricingTableSections(table) {
    if (!table) return;
    table.querySelectorAll('.pricing-table__table-section').forEach((section) => {
      const rows = section.querySelector('.pricing-table__table-section-rows');
      if (!rows) return;
      section.classList.remove('pricing-table__table-section--collapsed');
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
      const visibleTable = visibleWrapper?.querySelector('.pricing-table');
      requestAnimationFrame(() => expandPricingTableSections(visibleTable));
    });
  });

  // Universal pricing table: mobile tier tabs + section collapse/expand
  document.querySelectorAll('.pricing-table').forEach((table) => {
    const tierTabs = table.querySelectorAll('.pricing-table__tier-tab');
    if (tierTabs.length) {
      const updateMobileTierColumns = (activeTier) => {
        table.querySelectorAll('[data-tier-col]').forEach((col) => {
          col.classList.remove('pricing-table__table-cell--mobile-active');
        });
        table.querySelectorAll(`[data-tier-col="${activeTier}"]`).forEach((col) => {
          col.classList.add('pricing-table__table-cell--mobile-active');
        });
      };
      updateMobileTierColumns(tierTabs[0].dataset.tier);
      tierTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          tierTabs.forEach((t) => t.classList.remove('pricing-table__tier-tab--active'));
          tab.classList.add('pricing-table__tier-tab--active');
          updateMobileTierColumns(tab.dataset.tier);
        });
      });
    }

    const isInHiddenWrapper = table.closest('[data-features-tab]')?.classList.contains('qdrant-pricing-features__table-wrapper--hidden');
    table.querySelectorAll('.pricing-table__table-section').forEach((section) => {
      const header = section.querySelector('.pricing-table__table-section-header');
      const rows = section.querySelector('.pricing-table__table-section-rows');
      if (!header || !rows) return;

      header.addEventListener('click', () => {
        const isCollapsed = section.classList.contains('pricing-table__table-section--collapsed');
        if (isCollapsed) {
          rows.style.overflow = 'hidden';
          rows.style.maxHeight = rows.scrollHeight + 'px';
          section.classList.remove('pricing-table__table-section--collapsed');
        } else {
          rows.style.overflow = 'hidden';
          rows.style.maxHeight = rows.scrollHeight + 'px';
          rows.offsetHeight;
          rows.style.maxHeight = '0px';
          section.classList.add('pricing-table__table-section--collapsed');
        }
      });

      rows.addEventListener('transitionend', () => {
        if (!section.classList.contains('pricing-table__table-section--collapsed')) {
          rows.style.removeProperty('max-height');
          rows.style.removeProperty('overflow');
        }
      });
    });
  });
});
