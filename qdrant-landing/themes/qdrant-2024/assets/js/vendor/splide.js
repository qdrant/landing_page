import Splide from '@splidejs/splide';
import { MOBILE_WIDTH } from '../constants';

document.addEventListener( 'DOMContentLoaded', function() {
  if (document.querySelector('.splide')) {
    const splide = new Splide('.splide', {
      gap: "2rem",
      perPage: 3,
      type: "loop",
      drag: true,
      loop: true,
      speed: 1000,
      perMove: 1,
      pagination: false,
      classes: {
        arrows: 'splide__arrows customer-stories__controls',
        arrow: 'splide__arrow customer-stories__button',
        prev: 'splide__arrow--prev customer-stories__button-prev',
        next: 'splide__arrow--next customer-stories__button-next',
      },
          breakpoints: {
            [MOBILE_WIDTH]: {
             destroy: true
            }
          }
        });

    splide.on( 'ready', function () {
      const e = new CustomEvent('splideIsReady', {detail: splide});
      document.dispatchEvent(e);
    });

    splide.mount();
  }
});
