document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.features-table').forEach((table) => {
    const colTabs = table.querySelectorAll('.features-table__col-tab');
    if (colTabs.length) {
      const prevBtn = table.querySelector('.features-table__col-arrow--prev');
      const nextBtn = table.querySelector('.features-table__col-arrow--next');
      let activeIndex = 0;

      const updateMobileColumns = (activeCol) => {
        table.querySelectorAll('.features-table__table-cell[data-col]').forEach((col) => {
          col.classList.remove('features-table__table-cell--mobile-active');
        });
        table.querySelectorAll(`.features-table__table-cell[data-col="${activeCol}"]`).forEach((col) => {
          col.classList.add('features-table__table-cell--mobile-active');
        });
      };

      const setActiveCol = (index) => {
        const tab = colTabs[index];
        if (!tab) return;
        activeIndex = index;
        colTabs.forEach((t) => t.classList.remove('features-table__col-tab--active'));
        tab.classList.add('features-table__col-tab--active');
        updateMobileColumns(tab.dataset.col);
      };

      setActiveCol(0);

      colTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => setActiveCol(index));
      });

      prevBtn?.addEventListener('click', () => {
        setActiveCol((activeIndex - 1 + colTabs.length) % colTabs.length);
      });
      nextBtn?.addEventListener('click', () => {
        setActiveCol((activeIndex + 1) % colTabs.length);
      });
    }

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
