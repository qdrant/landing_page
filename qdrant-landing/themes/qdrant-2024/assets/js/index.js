import scrollHandler from './scroll-handler';
import { XXL_BREAKPOINT } from './constants';
import { initGoToTopButton, getCookie } from './helpers';
import { loadSegment, createSegmentStoredPage } from './segment-helpers';
import TableOfContents from './table-of-content';

createSegmentStoredPage();

// on document ready
document.addEventListener('DOMContentLoaded', function () {
  if (!window.analytics && getCookie('cookie-consent')) {
    loadSegment();
  }

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
    if (position <= mainMenuHeight) {
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
      console.log(item.dataset.path);
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
});
