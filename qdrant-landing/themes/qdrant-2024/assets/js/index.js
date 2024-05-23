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

  // Mobile menu

  const closeBtn = document.querySelector('.menu-mobile__close');
  const menuTrigger = document.querySelector('.main-menu__trigger');
  const menu = document.querySelector('.menu-mobile');
  menuTrigger.addEventListener('click', () => {
    menu.classList.add('menu-mobile--visible');
  });
  closeBtn.addEventListener('click', () => {
    menu.classList.remove('menu-mobile--visible');
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

});
