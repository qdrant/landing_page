import 'qdrant-page-search/dist/js/search.min.js';

(function () {
  // Try to read metadata tag for partition
  const metadata = document.querySelector('meta[name="partition"]');
  let partition = metadata ? metadata.content : null;

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

  if (/blog/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'blog', partition: partition });
  }

  if (/course/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'course', partition: partition });
  }

  if (/learn/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'articles,course,documentation' });
  }

  if (/customers/.test(window.location?.pathname)) {
    window.initQdrantSearch({ searchApiUrl: 'https://search.qdrant.tech/api/search', section: 'blog', partition: 'case-studies' });
  }
})();
