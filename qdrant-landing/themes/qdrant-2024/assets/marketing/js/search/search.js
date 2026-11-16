// Uses window.initQdrantSearch from lib/vendor/page-search.js, loaded first.
// Search configuration for the marketing part: the blog list and customer
// stories. The documentation part has its own in assets/docs/js/search/.

(function () {
  // Try to read metadata tag for partition
  const metadata = document.querySelector('meta[name="partition"]');
  let partition = metadata ? metadata.content : null;

  if (/blog/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'blog', partition: partition });
  }

  if (/customers/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'blog', partition: 'case-studies' });
  }
})();
