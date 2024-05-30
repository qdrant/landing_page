// theme switch
// can switch between dark, light and auto theme
// auto theme will change the theme based on the user's system preference

import { isNodeList } from './helpers';

class ThemeSwitch {
  constructor(options = { switcher: null, callbacks: [] }) {
    this.theme = localStorage.getItem('theme') || 'auto';
    this.switcher = options.switcher || document.querySelectorAll('.theme-switch');
    if (isNodeList(this.switcher)) {
      this.switcher.forEach((switcher) => {
        switcher.addEventListener('click', () => this.toggleTheme());
      });
    } else {
      this.switcher.addEventListener('click', () => this.toggleTheme());
    }
    this.callbacks = options.callbacks;
    this.setTheme();
  }

  setTheme() {
    let themeToApply;
    if (this.theme === 'auto') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        themeToApply = 'dark';
      } else {
        themeToApply = 'light';
      }
    } else {
      themeToApply = this.theme;
    }
    document.documentElement.setAttribute('data-theme', themeToApply);

    if (isNodeList(this.switcher)) {
      this.switcher.forEach((switcher) => {
        switcher.setAttribute('data-theme-label', this.theme);
      });
    } else {
      this.switcher.setAttribute('data-theme-label', this.theme);
    }
    localStorage.setItem('theme', this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : this.theme === 'light' ? 'auto' : 'dark';
    this.setTheme();
    this.callbacks.forEach((callback) => callback());
  }
}

export default ThemeSwitch;
