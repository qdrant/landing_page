import scrollHandler from './scroll-handler';
import { XXL_BREAKPOINT } from './constants';
import { addUTMToLinks, initGoToTopButton, persistUTMParams } from './helpers';
import { handleSegmentReady } from './segment-helpers';
import { addOneTrustPreferencesToLinks, registerAndCall } from './onetrust-helpers';
import TableOfContents from './table-of-content';
import { DOCS_HEADER_OFFSET } from './constants';
import { scrollIntoViewWithOffset } from './helpers';

persistUTMParams();

// on document ready
document.addEventListener('DOMContentLoaded', function () {
  addUTMToLinks();

  const handleOneTrustLoaded = () => {
    // One Trust Loaded
    window.OneTrust.OnConsentChanged(async () => {
      // One Trust Preference Updated
      addOneTrustPreferencesToLinks();
      registerAndCall();

      await window.analytics.track('onetrust_consent_preference_updated', {
        onetrust_active_groups: window.OnetrustActiveGroups ?? '',
      });
    });

    handleSegmentReady();

    // Only called once ∴ remove once called
    document.removeEventListener('onetrust_loaded', handleOneTrustLoaded);
  };

  document.addEventListener('onetrust_loaded', handleOneTrustLoaded);

  // Top banner activation
  const topBanner = document.querySelector('.top-banner');
  if (topBanner) {
    const start = parseInt(topBanner.getAttribute('data-start'));
    const end = parseInt(topBanner.getAttribute('data-end'));
    const now = Math.floor(Date.now() / 1000);
    if (start && now > start && (end ? now < end : true)) {
      topBanner.style.display = 'flex';
    }
  }

  // Header scroll
  const body = document.querySelector('body');
  const header = document.querySelector('.site-header');
  const topBannerHeight = topBanner?.offsetHeight ?? 0;
  const mainMenuHeight = document.querySelector('.main-menu')?.offsetHeight ?? 0;
  const PADDING_PART_TO_HIDE = 24;
  let menuOffset = window.innerWidth >= 1400 ? PADDING_PART_TO_HIDE : 0; // 24px is a PART of padding-top which we want to scroll over

  function addScrollStateToPage() {
    if (!header) {
      return;
    }
    header.style.minHeight = `${header.offsetHeight}px`;
    body.classList.add('scrolled');
  }

  function removeScrollStateFromPage() {
    if (!header) {
      return;
    }
    header.style.minHeight = '';
    body.classList.remove('scrolled');
  }

  window.addEventListener('resize', function () {
    menuOffset = window.innerWidth >= XXL_BREAKPOINT ? PADDING_PART_TO_HIDE : 0;
  });

  if (window.scrollY > topBannerHeight + menuOffset) {
    addScrollStateToPage();
  }

  scrollHandler.onScrollDown((position) => {
    if (position > topBannerHeight + menuOffset) {
      addScrollStateToPage();
    }
  });

  scrollHandler.onScrollUp((position) => {
    if (position <= topBannerHeight + menuOffset) {
      removeScrollStateFromPage();
    }
  });

  // Mobile menu

  const closeBtn = document.querySelector('.menu-mobile__close');
  const menuTrigger = document.querySelector('.main-menu__trigger');
  const menu = document.querySelector('.menu-mobile');
  menuTrigger.addEventListener('click', () => {
    menu.classList.add('menu-mobile--visible');
    body.classList.add('no-scroll');
  });
  closeBtn.addEventListener('click', () => {
    menu.classList.remove('menu-mobile--visible');
    body.classList.remove('no-scroll');
  });
  function toggleMenu(id) {
    const menuItem = document.querySelector(`[data-path=${id}]`);
    if (menuItem) {
      menuItem.classList.toggle('menu-mobile__item--active');
    }
  }

  document.querySelectorAll('.menu-mobile__item').forEach((item) => {
    item.addEventListener('click', () => {
      toggleMenu(item.dataset.path);
    });
  });

  // close mobile menu on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= XXL_BREAKPOINT) {
      menu.classList.remove('menu-mobile--visible');
    }
  });

  initGoToTopButton('#scrollToTopBtn');

  if (document.getElementById('TableOfContents') && document.querySelector('.qdrant-post__body')) {
    new TableOfContents('#TableOfContents', '.qdrant-post__body');
  }

  document.querySelectorAll('.card__content-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = link.dataset.href;
      window.history.pushState({}, '', url);
      window.location.href = url;
    });
  });

  function toggleAccordion() {
    this.parentElement.classList.toggle('active');
    const panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }

  const accordionButtons = Array.from(document.getElementsByClassName('accordion__item-header'));
  accordionButtons.forEach((el) => {
    el.addEventListener('click', toggleAccordion);
  });

  const accordionDarkButtons = Array.from(document.getElementsByClassName('accordion-dark__item-header'));
  accordionDarkButtons.forEach((el) => {
    el.addEventListener('click', toggleAccordion);
  });

  // Pricing FAQ accordion
  const pricingFaqItems = document.querySelectorAll('.qdrant-pricing-faq__item');
  pricingFaqItems.forEach((item) => {
    const question = item.querySelector('.qdrant-pricing-faq__question');
    if (question) {
      question.addEventListener('click', () => {
        item.classList.toggle('qdrant-pricing-faq__item--active');
      });
    }
  });

  // Pricing features tabs (Managed / On-Premise)
  function expandFeaturesTableSections(wrapper) {
    if (!wrapper || wrapper.classList.contains('qdrant-pricing-features__table-wrapper--hidden')) return;
    wrapper.querySelectorAll('.pricing-table__table-section').forEach((section) => {
      const rows = section.querySelector('.pricing-table__table-section-rows');
      if (!rows) return;
      section.classList.remove('qdrant-pricing-features__table-section--collapsed');
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
      // Expand sections in the newly visible table (they get maxHeight:0 when hidden)
      const visibleWrapper = document.querySelector(`[data-features-tab="${targetTab}"]`);
      requestAnimationFrame(() => {
        expandFeaturesTableSections(visibleWrapper);
      });
    });
  });

  // Pricing features mobile tier tabs
  function updateMobileTierColumns(activeTier) {
    const allTierCols = document.querySelectorAll('[data-tier-col]');
    allTierCols.forEach((col) => {
      col.classList.remove('pricing-table__table-cell--mobile-active');
    });
    const activeCols = document.querySelectorAll(`[data-tier-col="${activeTier}"]`);
    activeCols.forEach((col) => {
      col.classList.add('pricing-table__table-cell--mobile-active');
    });
  }

  const tierTabs = document.querySelectorAll('.pricing-table__tier-tab');
  if (tierTabs.length) {
    updateMobileTierColumns(tierTabs[0].dataset.tier);
    tierTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tierTabs.forEach((t) => t.classList.remove('pricing-table__tier-tab--active'));
        tab.classList.add('pricing-table__tier-tab--active');
        updateMobileTierColumns(tab.dataset.tier);
      });
    });
  }

  // Pricing features section collapse/expand
  document.querySelectorAll('.pricing-table__table-section').forEach((section) => {
    const header = section.querySelector('.pricing-table__table-section-header');
    const rows = section.querySelector('.qdrant-pricing-features__table-section-rows');
    if (!header || !rows) return;

    // Only set maxHeight for visible sections (hidden table has scrollHeight 0)
    const wrapper = section.closest('[data-features-tab]');
    if (!wrapper?.classList.contains('qdrant-pricing-features__table-wrapper--hidden')) {
      rows.style.maxHeight = rows.scrollHeight + 'px';
    }

    header.addEventListener('click', () => {
      const isCollapsed = section.classList.contains('pricing-table__table-section--collapsed');

      if (isCollapsed) {
        rows.style.maxHeight = rows.scrollHeight + 'px';
        section.classList.remove('pricing-table__table-section--collapsed');
      } else {
        rows.style.maxHeight = rows.scrollHeight + 'px';
        requestAnimationFrame(() => {
          rows.style.maxHeight = '0px';
          section.classList.add('pricing-table__table-section--collapsed');
        });
      }
    });

    rows.addEventListener('transitionend', () => {
      if (!section.classList.contains('pricing-table__table-section--collapsed')) {
        rows.style.maxHeight = 'none';
      }
    });
  });

  // Pricing doors tabs
  const pricingDoorsTabs = document.querySelectorAll('.qdrant-pricing-doors-b__tab');
  const pricingDoorsContainers = document.querySelectorAll('[data-doors-tab]');
  pricingDoorsTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      pricingDoorsTabs.forEach((t) => t.classList.remove('qdrant-pricing-doors-b__tab--active'));
      tab.classList.add('qdrant-pricing-doors-b__tab--active');
      const targetTab = tab.dataset.tab;
      pricingDoorsContainers.forEach((container) => {
        container.classList.toggle('qdrant-pricing-doors-b__doors--hidden', container.dataset.doorsTab !== targetTab);
      });
    });
  });

  // Pricing comparison mobile tier tabs
  function updateComparisonMobileTierColumns(activeTier) {
    const allTierCols = document.querySelectorAll('.qdrant-pricing-comparison [data-tier-col]');
    allTierCols.forEach((col) => {
      col.classList.remove('pricing-table__table-cell--mobile-active');
    });
    const activeCols = document.querySelectorAll(`.qdrant-pricing-comparison [data-tier-col="${activeTier}"]`);
    activeCols.forEach((col) => {
      col.classList.add('pricing-table__table-cell--mobile-active');
    });
  }

  const comparisonTierTabs = document.querySelectorAll('.qdrant-pricing-comparison .pricing-table__tier-tab');
  if (comparisonTierTabs.length) {
    updateComparisonMobileTierColumns(comparisonTierTabs[0].dataset.tier);
    comparisonTierTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        comparisonTierTabs.forEach((t) => t.classList.remove('pricing-table__tier-tab--active'));
        tab.classList.add('pricing-table__tier-tab--active');
        updateComparisonMobileTierColumns(tab.dataset.tier);
      });
    });
  }

  // Pricing comparison section collapse/expand
  document.querySelectorAll('.qdrant-pricing-comparison .pricing-table__table-section').forEach((section) => {
    const header = section.querySelector('.pricing-table__table-section-header');
    const rows = section.querySelector('.pricing-table__table-section-rows');
    if (!header || !rows) return;

    rows.style.maxHeight = rows.scrollHeight + 'px';

    header.addEventListener('click', () => {
      const isCollapsed = section.classList.contains('pricing-table__table-section--collapsed');

      if (isCollapsed) {
        rows.style.maxHeight = rows.scrollHeight + 'px';
        section.classList.remove('pricing-table__table-section--collapsed');
      } else {
        rows.style.maxHeight = rows.scrollHeight + 'px';
        requestAnimationFrame(() => {
          rows.style.maxHeight = '0px';
          section.classList.add('pricing-table__table-section--collapsed');
        });
      }
    });

    rows.addEventListener('transitionend', () => {
      if (!section.classList.contains('pricing-table__table-section--collapsed')) {
        rows.style.maxHeight = 'none';
      }
    });
  });

  // scroll to anchors:
  let offset = DOCS_HEADER_OFFSET;

  if (window.location.hash) {
    scrollIntoViewWithOffset(window.location.hash.replace('#', ''), offset);
  }

  let allLinks = document.querySelectorAll('a[href^="#"]');

  allLinks.forEach((anchor) => {
    const target = anchor.getAttribute('href');
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      history.pushState(null, null, target);
      scrollIntoViewWithOffset(target.replace('#', ''), offset);
    });
  });
});
