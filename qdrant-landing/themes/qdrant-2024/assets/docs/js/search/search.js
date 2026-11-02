// Uses window.initQdrantSearch from common/js/page-search.js, loaded first.
// Search configuration for the documentation part: documentation, learn,
// articles, and course. The marketing part has its own in assets/js/search/.

(function () {
  // Try to read metadata tag for partition
  const metadata = document.querySelector('meta[name="partition"]');
  let partition = metadata ? metadata.content : null;

  // Tutorials span several partitions; use the Learn catalog's paths instead.
  const learnSections = document.querySelector('meta[name="learn-search-sections"]');
  if (learnSections) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: learnSections.content });
    return;
  }

  // Treat 'develop' and 'deploy' as a unified search space
  let searchPartition;
  if (partition === 'develop' || partition === 'deploy') {
    searchPartition = 'develop,deploy,cloud,qdrant';
  } else {
    searchPartition = partition;
  }

  if (/documentation|docs/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'documentation', partition: searchPartition });
  }

  if (/articles/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'articles', partition: partition });
  }

  if (/course/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'course', partition: partition });
  }
})();
