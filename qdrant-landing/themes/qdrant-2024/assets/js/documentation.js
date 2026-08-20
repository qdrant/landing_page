import ThemeSwitch from './theme-switch.js';
import TableOfContents from './table-of-content';

const themeSwitch = new ThemeSwitch();

document.addEventListener('DOMContentLoaded', () => {
  themeSwitch.initSwitcher();

  // if #TableOfContents and .documentation-article exists on the page, initialize TableOfContents class
  if (document.getElementById('TableOfContents') && document.querySelector('.documentation-article')) {
    new TableOfContents('#TableOfContents', '.documentation-article');
  }

  // iOS Safari: tapping <a> inside <summary> navigates instead of toggling <details>.
  // When the section is closed, intercept the click and expand it instead.
  document.querySelectorAll('.docs-menu details > summary > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const details = this.closest('details');
      if (!details.open) {
        e.preventDefault();
        details.open = true;
      }
    });
  });
});
