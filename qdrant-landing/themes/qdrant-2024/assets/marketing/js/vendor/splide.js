import Splide from '@splidejs/splide';
import { XL_BREAKPOINT } from '../constants';

document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector('.splide')) {
    const splide = new Splide('.splide', {
      gap: '1.5rem',
      perPage: 3,
      type: 'loop',
      drag: true,
      loop: true,
      speed: 1000,
      perMove: 1,
      pagination: false,
      padding: { left: 20, right: 20 },
      breakpoints: {
        [XL_BREAKPOINT]: {
          destroy: true,
        },
      },
    });

    splide.on('ready', function () {
      const e = new CustomEvent('splideIsReady', { detail: splide });
      document.dispatchEvent(e);
    });

    splide.mount();
  }
});
