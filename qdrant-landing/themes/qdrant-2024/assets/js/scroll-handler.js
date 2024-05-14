export class ScrollHandler {
  constructor() {
    this.lastScrollTop = 0;
    this.scrollDownCallbacks = [];
    this.scrollUpCallbacks = [];
    window.addEventListener('scroll', () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      if (st > this.lastScrollTop) {
        this.scrollDownCallbacks.forEach(cb => cb(st));
      } else {
        this.scrollUpCallbacks.forEach(cb => cb(st));
      }
      this.lastScrollTop = st <= 0 ? 0 : st;
    }, false);
  }

  onScrollDown(cb) {
    this.scrollDownCallbacks.push(cb);
  }

  onScrollUp(cb) {
    this.scrollUpCallbacks.push(cb);
  }
}

const scrollHandler = new ScrollHandler();

export default scrollHandler;
