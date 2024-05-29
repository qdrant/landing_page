// theme switch
// can switch between dark, light and auto theme
// auto theme will change the theme based on the user's system preference

class ThemeSwitch {
  constructor(options = {switcher: null, callbacks: []}) {
    this.theme = localStorage.getItem('theme') || 'auto';
    this.switcher = options.switcher || document.querySelector('#theme-switcher');
    this.switcher.addEventListener('click', () => this.toggleTheme());
    this.callbacks = options.callbacks;
    this.setTheme();
  }

  setTheme() {
    const themeToApply = this.theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : this.theme;
    document.documentElement.setAttribute('data-theme', themeToApply);
    this.switcher.setAttribute('data-theme-label', this.theme);
    localStorage.setItem('theme', this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : this.theme === 'light' ? 'auto' : 'dark';
    this.setTheme();
    this.callbacks.forEach(callback => callback());
  }
}

export default ThemeSwitch;

