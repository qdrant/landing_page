import { trackAllClicksIn } from './segment-helpers';

// ponytail: /cloud only, so Segment volume elsewhere is untouched.
// Move to index.js to take it sitewide.
trackAllClicksIn(document);

// Capabilities
(function initCapabilities() {
  const stickyWrap = document.querySelector('.qdrant-cloud-capabilities__tabs-sticky');
  const tabsWrap = document.querySelector('[data-capabilities-tabs]');
  const buttons = [...document.querySelectorAll('[data-capabilities-tab]')];
  const panels = [...document.querySelectorAll('[data-capabilities-panel]')];

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
    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    if (scrollTabs) {
      scrollButtonIntoViewX(buttons[index]);
    }
  };

  const getCurrentIndex = () => {
    const line = getOffset() + HYSTERESIS;
    let current = 0;

    panels.forEach((panel, index) => {
      if (panel.getBoundingClientRect().top <= line) {
        current = index;
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
      const index = Number(btn.dataset.capabilitiesTab);
      const panel = panels[index];
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
})();

// Dev-experience
(function initDevExperience() {
  const buttons = [...document.querySelectorAll('[data-dev-experience-tab]')];
  const panels = [...document.querySelectorAll('[data-dev-experience-panel]')];

  if (!buttons.length || !panels.length) return;

  const setActive = (index) => {
    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    panels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === index);
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.devExperienceTab);
      setActive(index);
    });
  });
})();

// FAQ
(function initFaq() {
  const buttons = [...document.querySelectorAll('[data-faq-category]')];
  const panels = [...document.querySelectorAll('[data-faq-panel]')];

  if (!buttons.length || !panels.length) return;

  const setActiveCategory = (index) => {
    buttons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === index);
    });

    panels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === index);
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.faqCategory);
      setActiveCategory(index);
    });
  });
})();
