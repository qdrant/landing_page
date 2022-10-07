// todo: move here all vendor scripts and initialisations
import 'bootstrap';
import Splide from '@splidejs/splide';

// onload
document.addEventListener( 'DOMContentLoaded', function() {
  if (document.querySelector('.splide')) {
    const splide = new Splide('.splide');

    splide.on( 'ready', function () {
      const e = new CustomEvent('splideIsReady', {detail: splide});
      document.dispatchEvent(e);
    });

    splide.mount();
  }
});