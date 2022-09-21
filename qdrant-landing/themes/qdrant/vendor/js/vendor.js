// todo: move here all vendor scripts and initialisations
import 'bootstrap';
import Splide from '@splidejs/splide';

// todo: onload
document.addEventListener( 'DOMContentLoaded', function() {
  if (document.querySelector('.splide')) {
    new Splide('.splide').mount();
  }
});