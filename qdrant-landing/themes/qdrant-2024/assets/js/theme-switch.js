import { isNodeList } from './helpers';

/**
 * ThemeSwitch
 * @class
 * @classdesc ThemeSwitch class to switch between dark, light and auto themes trough clicking on the switcher element , auto theme will change the theme based on the user's system preference
 * @param {Object} options - ThemeSwitch options
 * @param {HTMLElement|NodeList} options.switcher - Theme switcher element
 * @param {Array} options.callbacks - Callbacks to run after theme switch
 */
class ThemeSwitch {
  #userSwitcherEl = null;
  constructor(options = { switcher: null, callbacks: [] }) {
    this.#userSwitcherEl = options.switcher;
    this.theme = localStorage.getItem('theme') || 'dark';
    this.switcher = null;
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

    if (!this.switcher) return;
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

  initSwitcher() {
    this.switcher = this.#userSwitcherEl || document.querySelectorAll('.theme-switch');
    if (isNodeList(this.switcher)) {
      this.switcher.forEach((switcher) => {
        switcher.addEventListener('click', () => this.toggleTheme());
      });
    } else {
      this.switcher.addEventListener('click', () => this.toggleTheme());
    }
    this.setTheme();
  }
}

export default ThemeSwitch;
