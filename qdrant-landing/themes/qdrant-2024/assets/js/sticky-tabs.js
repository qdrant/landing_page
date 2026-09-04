(function () {
  document.querySelectorAll('[data-sticky-tabs]').forEach((root) => {
    const stickyWrap = root.querySelector('[data-sticky-tabs-sticky]');
    const tabsWrap = root.querySelector('[data-sticky-tabs-nav]');
    const buttons = [...root.querySelectorAll('[data-sticky-tab]')];
    const panels = [...root.querySelectorAll('[data-sticky-panel]')];

    if (!tabsWrap || !buttons.length || !panels.length) return;

    const EXTRA_OFFSET = 64;
    const HYSTERESIS = 24;

    let currentIndex = -1;
    let lockedIndex = null;
    let unlockTimer = null;

    const getOffset = () =>
      (stickyWrap ? stickyWrap.offsetHeight : tabsWrap.offsetHeight) + EXTRA_OFFSET;

    const scrollButtonIntoViewX = (btn) => {
      if (!btn || tabsWrap.scrollWidth <= tabsWrap.clientWidth) return;

      const wrapRect = tabsWrap.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const nextLeft =
        tabsWrap.scrollLeft +
        (btnRect.left - wrapRect.left) -
        (wrapRect.width - btnRect.width) / 2;

      tabsWrap.scrollTo({ left: nextLeft, behavior: 'auto' });
    };

    const setActive = (index, { scrollTabs = false } = {}) => {
      if (index < 0 || index >= buttons.length) return;
      if (index === currentIndex) return;

      currentIndex = index;
      buttons.forEach((btn) => {
        btn.classList.toggle('active', Number(btn.dataset.stickyTab) === index);
      });

      if (scrollTabs) {
        const activeBtn = buttons.find((btn) => Number(btn.dataset.stickyTab) === index);
        scrollButtonIntoViewX(activeBtn);
      }
    };

    const getCurrentIndex = () => {
      const line = getOffset() + HYSTERESIS;
      let current = 0;

      panels.forEach((panel) => {
        if (panel.getBoundingClientRect().top <= line) {
          current = Number(panel.dataset.stickyPanel);
        }
      });

      return current;
    };

    const clearLock = () => {
      lockedIndex = null;
      if (unlockTimer) {
        clearTimeout(unlockTimer);
        unlockTimer = null;
      }
    };

    const lockTo = (index) => {
      lockedIndex = index;
      setActive(index, { scrollTabs: true });

      if (unlockTimer) clearTimeout(unlockTimer);
      unlockTimer = setTimeout(() => {
        lockedIndex = null;
        unlockTimer = null;
      }, 1500);
    };

    const onScroll = () => {
      if (lockedIndex !== null) return;
      setActive(getCurrentIndex(), { scrollTabs: true });
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.stickyTab);
        const panel = panels.find((item) => Number(item.dataset.stickyPanel) === index);
        if (!panel) return;

        lockTo(index);

        const top = window.scrollY + panel.getBoundingClientRect().top - getOffset();
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });

    window.addEventListener('scrollend', () => {
      if (lockedIndex === null) return;
      clearLock();
      setActive(currentIndex, { scrollTabs: true });
    });

    if (!('onscrollend' in window)) {
      let idleTimer = null;
      window.addEventListener('scroll', () => {
        if (lockedIndex === null) return;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          clearLock();
        }, 120);
      }, { passive: true });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  });
})();