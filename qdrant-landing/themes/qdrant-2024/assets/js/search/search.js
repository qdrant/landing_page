import 'qdrant-page-search/dist/js/search.min.js';

(function () {
  // Try to read metadata tag for partition
  const metadata = document.querySelector('meta[name="partition"]');
  let partition = null;
  if (metadata) {
    partition = metadata.content;
  }

  if (/documentation|docs/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'documentation', partition: partition });
  }

  if (/articles/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'articles', partition: partition });
  }

  if (/blog/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'blog', partition: partition });
  }

  if (/course/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'course', partition: partition });
  }
})();
