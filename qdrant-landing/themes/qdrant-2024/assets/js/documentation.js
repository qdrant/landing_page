import ThemeSwitch from './theme-switch.js';
import TableOfContents from './table-of-content';

const themeSwitch = new ThemeSwitch();

document.addEventListener('DOMContentLoaded', () => {
  themeSwitch.initSwitcher();

  // if #TableOfContents and .documentation-article exists on the page, initialize TableOfContents class
  if (document.getElementById('TableOfContents') && document.querySelector('.documentation-article')) {
    new TableOfContents('#TableOfContents', '.documentation-article');
  }
});
