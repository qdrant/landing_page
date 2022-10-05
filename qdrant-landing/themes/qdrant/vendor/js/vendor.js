// todo: move here all vendor scripts and initialisations
import 'bootstrap';
import Splide from '@splidejs/splide';
import qdrSearch from 'qdrant-page-search';

// todo: onload
document.addEventListener( 'DOMContentLoaded', function() {
  if (document.querySelector('.splide')) {
    new Splide('.splide').mount();
  }

  if (/documentation/.test(window.location?.pathname)) {
    window.initQdrantSearch({searchApiUrl: 'https://search.qdrant.tech/api/search'});
  }
});