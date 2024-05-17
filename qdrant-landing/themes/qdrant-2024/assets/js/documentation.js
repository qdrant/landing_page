// script for the documentation page
import { checkIfElementHasScrollbar } from './helpers.js';
document.addEventListener('DOMContentLoaded', function () {
  const docsMenu = document.querySelector('.docs-menu');
  const docsMenuLinks = document.querySelector('.docs-menu__links');

  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar-toggle').classList.toggle('active');
    document.getElementById('sidebar').classList.toggle('active');
  });

  document.querySelectorAll('.docs-menu__links-group-heading').forEach((el) => {
    el.addEventListener('click', () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!checkIfElementHasScrollbar(docsMenuLinks) && docsMenu.classList.contains('horizontal-blur')) {
            docsMenu.classList.remove('horizontal-blur');
          } else if (checkIfElementHasScrollbar(docsMenuLinks) === 'vertical' && !docsMenu.classList.contains('horizontal-blur')) {
            docsMenu.classList.add('horizontal-blur');
          }
        });
      });
    });
  });

  if (checkIfElementHasScrollbar(docsMenuLinks) === 'vertical') {
    docsMenu.classList.add('horizontal-blur');

    docsMenuLinks.addEventListener('scroll', () => {
      const isScrolledToTheEnd = docsMenuLinks.scrollHeight - docsMenuLinks.scrollTop === docsMenuLinks.clientHeight;
      if (isScrolledToTheEnd) {
        docsMenu.classList.remove('horizontal-blur');
      } else {
        docsMenu.classList.add('horizontal-blur');
      }
    });
  }
});
