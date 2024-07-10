import ThemeSwitch from './theme-switch.js';
import { XL_BREAKPOINT } from './constants';

const themeSwitch = new ThemeSwitch();

document.addEventListener('DOMContentLoaded', () => {
  themeSwitch.initSwitcher();
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const searchbar = document.getElementsByClassName('docs-menu__input')[0];
  const docsMenu = document.getElementsByClassName('docs-menu')[0];

  sidebarToggle.addEventListener('click', () => {
    sidebarToggle.classList.toggle('active');
    sidebar.classList.toggle('active');
  });

  const moveSearchButton = function() {
    const checkIfFirstChildIsSearch = (element) => {
      return element.children.length > 0 && element.children[0].classList.contains('docs-menu__input');
    }

    const isMobile = window.innerWidth <= XL_BREAKPOINT;
    if (isMobile && !checkIfFirstChildIsSearch(docsMenu)) {
      docsMenu.before(searchbar);
    } else if (!isMobile && !checkIfFirstChildIsSearch(sidebar)) {
      sidebar.before(searchbar);
    }
  }

  moveSearchButton();

  window.addEventListener('resize', moveSearchButton);
});
