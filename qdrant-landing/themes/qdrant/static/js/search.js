(function () {
  // todo: 1. сделать все ~~библиотекой~~ плагином

  /**
   * @class Search
   * @param {String} ref - query input DOM element - DOM element
   * @param {String} apiUrl - URL of the search API
   */
  class Search {
    #updEvent;
    #dataVersion;

    constructor(selector, apiUrl) {
      this.ref = document.querySelector(selector);
      this.apiUrl = apiUrl;
      this.data = [];
      this.#updEvent = new Event('searchDataIsReady');
      this.#dataVersion = 0;

      // listens when user types in the search input
      this.boundEventHandler = this.fetchData.bind(this)
      this.ref.addEventListener('keyup', this.boundEventHandler)
    }

    get data() {
      return this._data;
    }

    set data(newData) {
      this._data = newData;
    }

    /**
     * request data using search string
     * await data with the next structure:
     *  {result: [
     *  {
     * "payload": {
     *   "location": "html > body > div:nth-of-type(1) > section:nth-of-type(2) > div > div > div > article > h3:nth-of-type(4)",
     *  "sections": [
     *    "documentation",
     *    "documentation/quick_start"
     *  ],
     *  "tag": "h3",
     *  "text": "Search with filtering",
     *  "titles": [
     *    "Qdrant - Quick Start",
     *    "Add points"
     *  ],
     *  "url": "https://qdrant.tech/documentation/quick_start/"
     * },
     * "score": 0.96700734
     * },
     * ...
     * ]}
     */
    fetchData() {
      const url = this.apiUrl + '/?q=' + this.ref.value;
      let reqVersion = this.#dataVersion + 1;

      fetch(url)
        .then(res => res.json())
        .then(data => {

          if (reqVersion > this.#dataVersion) {
            this.data = data.result;
            this.#dataVersion = reqVersion;
            document.dispatchEvent(this.#updEvent);
          }
        });
    }
  }

  /**
   * adds an encoded in base64 selector to the url
   * @param data
   * @return {string}
   */
  const generateUrlWithSelector = (data) => {
    // todo: remove replace
    const url = new URL(data?.payload?.url.replace('https://qdrant.tech', 'http://localhost:1313'));
    url.searchParams.append('selector', btoa(data?.payload?.location));

    return url.toString();
  }

  /**
   * generates DOM element (<a>) with inner HTML for one result
   * @param data - an object for one result
   * @return {HTMLAnchorElement}
   */
  const generateSearchResult = (data) => {
    const resultElem = document.createElement('a');
    resultElem.classList.add('media', 'qdr-search-result');
    resultElem.href = generateUrlWithSelector(data);
    resultElem.innerHTML = `<span class="align-self-center qdr-search-result__icon"><i class="fas fa-file-alt"></i></span>
                   <div class="media-body"><h5 class="mt-0">${data.payload.titles.join(' > ')}</h5>
                   <p>${data.payload.text}</p></div>`;
    return resultElem;
  }

  // when a search modal is shown
  $('#searchModal').on('shown.bs.modal', function (event) {
    document.getElementById("searchInput").focus();
    // todo: replace with a real url
    const search = new Search('#searchInput', '/temp/data.json');

    document.addEventListener('searchDataIsReady', () => {
      const resultsContainerSelector = '.qdr-search__results';
      const resultsContainer = document.querySelector(resultsContainerSelector);
      const newResultChildren = [];
      search.data.forEach(res => {
        newResultChildren.push(generateSearchResult(res));
      });
      resultsContainer.replaceChildren(...newResultChildren);
    });
  });
})();
