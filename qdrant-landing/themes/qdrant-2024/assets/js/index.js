import scrollHandler from './scroll-handler';

// on document ready
document.addEventListener('DOMContentLoaded', function () {
  // Header scroll
  const body = document.querySelector('body');
  const header = document.querySelector('.site-header');
  const topBannerHeight = document.querySelector('.top-banner')?.offsetHeight ?? 0;
  const mainMenuHeight = document.querySelector('.main-menu')?.offsetHeight ?? 0;
  let menuOffset = window.innerWidth >= 1400 ? 24 : 0; // 24px is a PART of padding-top which we want to scroll over
  window.addEventListener('resize', function () {
    menuOffset = window.innerWidth >= 1400 ? 24 : 0;
  });

  scrollHandler.onScrollDown((position) => {
    if (position > topBannerHeight + menuOffset) {
      header.style.minHeight = `${header.offsetHeight}px`;
      body.classList.add('scrolled');
    }
  });

  scrollHandler.onScrollUp((position) => {
    if (position <= mainMenuHeight) {
      header.style.minHeight = '';
      body.classList.remove('scrolled');
    }
  });
});
