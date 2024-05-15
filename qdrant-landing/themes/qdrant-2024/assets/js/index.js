import scrollHandler from './scroll-handler';
import { XXL_BREAKPOINT } from './constants';

// on document ready
document.addEventListener('DOMContentLoaded', function () {
  // Header scroll
  const body = document.querySelector('body');
  const header = document.querySelector('.site-header');
  const topBannerHeight = document.querySelector('.top-banner')?.offsetHeight ?? 0;
  const mainMenuHeight = document.querySelector('.main-menu')?.offsetHeight ?? 0;
  const PADDING_PART_TO_HIDE = 24;
  let menuOffset = window.innerWidth >= 1400 ? PADDING_PART_TO_HIDE : 0; // 24px is a PART of padding-top which we want to scroll over

  function addScrollStateToPage() {
    header.style.minHeight = `${header.offsetHeight}px`;
    body.classList.add('scrolled');
  }

  function removeScrollStateFromPage() {
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
});
