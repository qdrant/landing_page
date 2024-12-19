import 'qdrant-page-search/dist/js/search.min.js';

(function () {
  if (/documentation|docs/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'documentation' });
  }

  if (/articles/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'articles' });
  }

  if (/blog/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'blog' });
  }
})();
