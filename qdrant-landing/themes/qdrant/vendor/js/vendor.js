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
    window.initQdrantSearch({searchApiUrl: 'https://gist.githubusercontent.com/generall/1caf4639b62d1014d216f4b7b5027b83/raw/b8e052e45067241fa79be647e3b23d60577363f2/qdrant-docs-search-example.json'});
  }
});