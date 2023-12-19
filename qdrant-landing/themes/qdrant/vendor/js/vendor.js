// todo: move here all vendor scripts and initialisations
import 'bootstrap';
import Splide from '@splidejs/splide';

// onload
document.addEventListener( 'DOMContentLoaded', function() {

  // check if location is a root
  if (window.location.pathname === '/') {

  if (document.querySelector('.splide')) {
    const splide = new Splide('.splide');

    splide.on('ready', function() {
      const e = new CustomEvent('splideIsReady', {detail: splide});
      document.dispatchEvent(e);
    });

    splide.mount();
  }
  }

  // check if location is a blog
  if (window.location.pathname === '/blog/') {
    var splide = new Splide( '.splide', {
      type     : 'loop',
      gap      : '1rem',
      arrows   : false,
      focus    : 0,
      autoWidth: true,
      pagination: true,
    } );

    splide.mount();
  }
});