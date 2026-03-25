const UTM_PARAMS_KEY = 'utm_params';

export function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function scrollIntoViewWithOffset(id, offset) {
  offset = offset || 0;

  const targetPosition =
    document.getElementById(id).getBoundingClientRect().top - document.body.getBoundingClientRect().top - offset;

  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth',
  });
}

export function isNodeList(list) {
  return Object.prototype.isPrototypeOf.call(NodeList.prototype, list);
}

export function initGoToTopButton(selector) {
  const button = document.querySelector(selector || '.go-to-top');

  if (!button) {
    return;
  }

  window.addEventListener('scroll', () => {
    const shouldShow = window.scrollY > window.innerHeight / 3;
    button.classList.toggle('d-block', shouldShow);
    button.classList.toggle('d-none', !shouldShow);
  });

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// GET COOKIE
export function getCookie(name) {
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  name = name + "=";
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
}

// SET COOKIE
export function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + date.toUTCString();
  document.cookie = name + '=' + value + ';' + expires + ';path=/;Secure';
}

// Logging in Development Mode (localhost)
export function devLog(str) {
  if (window.location.host.includes('localhost')) {
    console.log(str)
  }
}

const CROSS_SITE_URL_PARAM_KEY = 'qdrant_tech_ajs_anonymous_id';
export function tagCloudUILinksWithAnonymousId() {
  const targetUrl = 'https://cloud.qdrant.io/';

  const anonymousId = analytics.user().anonymousId();
  
  // Function to add or update query parameter in the URL
  function addOrUpdateQueryParam(url, paramName, paramValue) {
    const urlObj = new URL(url, window.location.origin); // Ensures URL is absolute
    urlObj.searchParams.set(paramName, paramValue);
    return urlObj.toString();
  }

  // Select all <a> elements with href exactly containing targetUrl
  const links = document.querySelectorAll(`a[href^="${targetUrl}"]`);

  // Loop through all selected <a> elements and update their href
  links.forEach(link => {
    link.href = addOrUpdateQueryParam(link.href, CROSS_SITE_URL_PARAM_KEY, anonymousId);
  });
}

export function addGA4Properties(properties) {
  const gaMeasurementId = getCookie('ga_measurement_id')?.replace('G-', '');
  properties.ga_session_id = getCookie('_ga_' + gaMeasurementId)?.replace('GS1.1.','').split('.')[0];
  properties.ga_client_id = getCookie('_ga')?.replace('GA1.1.','');
}

export function persistUTMParams() {
  if (!window.location.search) return;

  const urlUtmParams = getUTMParams(); 

  if (!Object.keys(urlUtmParams).some(key => urlUtmParams[key])) return;

  let filteredParams = '';
  let ampersand = false;

  for (const key in urlUtmParams) {
    if (urlUtmParams[key]) {
      ampersand = filteredParams.length > 0;
      filteredParams += `${ampersand ? '&' : ''}${key}=${urlUtmParams[key]}`;
    }
  }

  if (filteredParams) {
    sessionStorage.setItem(UTM_PARAMS_KEY, filteredParams);
  }
}

export function getStoredUTMParams() {
    return sessionStorage.getItem(UTM_PARAMS_KEY);
}

export function getUTMParams() {
  const search = window.location.search;
  
  if (!search) return {};

  const urlParams = new URLSearchParams(search);

  return {
      gclid: urlParams.get('gclid'),
      gbraid: urlParams.get('gbraid'),
      wbraid: urlParams.get('wbraid'),
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_content: urlParams.get('utm_content'),
      utm_term: urlParams.get('utm_term')
  };
}

export function addUTMToLinks() {
  const utmParams = getStoredUTMParams();

  if (utmParams) {
      const links = document.querySelectorAll('a[href*="cloud.qdrant.io"]'); 
      
      links.forEach(link => {
          const href = link.href;
          const separator = href.indexOf('?') === -1 ? '?' : '&';
          if (!href.includes(UTM_PARAMS_KEY)) {
              link.href = `${href}${separator}${utmParams}&qdrant_ref=qdrant_tech`;
          }
      });
  }
}

// Customers filters and pagination
const FILTER_KEYS = [
  "industry",
  "product",
  "company_size",
  "location",
  "use_cases"
];

const DESKTOP_MIN_WIDTH = 992;

function initCustomersViewToggle(root) {
  const bar = root.querySelector("[data-customers-view-toggle]");
  if (!bar) return;

  const btnGrid = bar.querySelector('[data-view-btn="grid"]');
  const btnList = bar.querySelector('[data-view-btn="list"]');

  const blockGrid = root.querySelector('[data-view-block="grid"]');
  const blockList = root.querySelector('[data-view-block="list"]');

  if (!btnGrid || !btnList || !blockGrid || !blockList) return;

  const setMode = (mode) => {
    const isGrid = mode === "grid";

    btnGrid.classList.toggle("active", isGrid);
    btnList.classList.toggle("active", !isGrid);

    blockGrid.classList.toggle("active", isGrid);
    blockList.classList.toggle("active", !isGrid);
  };

  btnGrid.addEventListener("click", () => setMode("grid"));
  btnList.addEventListener("click", () => setMode("list"));

  setMode("grid");
}

function isDesktop() {
  return window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches;
}

function getActiveFilters(filterInputs) {
  return filterInputs.reduce(
    (acc, input) => {
      if (!input.checked) return acc;
      const key = input.dataset.filterKey;
      if (FILTER_KEYS.includes(key)) acc[key].push(input.value);
      return acc;
    },
    {
      industry: [],
      product: [],
      company_size: [],
      location: [],
      use_cases: []
    }
  );
}

function matchesFilters(card, filters) {
  for (const key of FILTER_KEYS) {
    const selected = filters[key];
    if (!selected.length) continue;

    if (key === "use_cases") {
      const cardUseCases = (card.dataset.use_cases ?? "")
        .split("||")
        .filter(Boolean);
      const ok = selected.some((v) => cardUseCases.includes(v));
      if (!ok) return false;
      continue;
    }

    const val = card.dataset[key] ?? "";
    if (!selected.includes(val)) return false;
  }
  return true;
}

function parseSortValue(value) {
  if (!value) return null;
  const [field, dir = "asc"] = value.split("-");
  return { field, dir };
}

function sortCardsByField(cards, sortValue) {
  const parsed = parseSortValue(sortValue);
  if (!parsed) return [...cards];

  const { field, dir } = parsed;
  const order = dir === "desc" ? -1 : 1;

  return [...cards].sort((a, b) => {
    const av = (a.dataset[field] ?? "").toLowerCase();
    const bv = (b.dataset[field] ?? "").toLowerCase();
    if (av < bv) return -1 * order;
    if (av > bv) return 1 * order;
    return 0;
  });
}

function closeAllFilterAccordions(root) {
  const headers = root.querySelectorAll(".customers-case-studies__accordion-header");

  headers.forEach((header) => {
    header.parentElement?.classList.remove("active");
    const panel = header.nextElementSibling;
    if (panel && panel.classList.contains("customers-case-studies__accordion-body")) {
      panel.style.maxHeight = null;
    }
  });
}

function initCustomersMobileFilters(root, { onClose, onOpen, onApply, onClear }) {
  const openBtn = root.querySelector(".customers-case-studies__filter-mobile-button");
  const closeBtn = root.querySelector(".customers-case-studies__filters-close-button");
  const applyBtn = root.querySelector(".customers-case-studies__filters-apply-button");
  const clearBtn = root.querySelector(".customers-case-studies__filters-clear-button");
  const panel = root.querySelector(".customers-case-studies__filters");

  if (!panel) return;

  const open = () => {
    panel.classList.add("active");
    onOpen?.();
  };

  const close = () => {
    panel.classList.remove("active");
    onClose?.();
    closeAllFilterAccordions(root);
  };

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  applyBtn?.addEventListener("click", () => {
    onApply?.();
    panel.classList.remove("active");
    closeAllFilterAccordions(root);
  });
  clearBtn?.addEventListener("click", () => onClear?.());
}

export function initCustomersCaseStudies(root) {
  initCustomersViewToggle(root);

  const batchSize = Number(root.dataset.batchSize ?? 12) || 12;
  const resultsGrid = root.querySelector("[data-results-grid]");
  const resultsList = root.querySelector("[data-results-list]");
  const sortSelect = root.querySelector("[data-sort-select]");
  const filterInputs = [...root.querySelectorAll("[data-filter-input]")];
  const loadMoreBtn = root.querySelector("[data-load-more]");

  if (!resultsGrid || !resultsList) return;

  const gridCards = [...resultsGrid.querySelectorAll("[data-client-card]")];
  const listCards = [...resultsList.querySelectorAll("[data-client-card]")];

  let visibleBatchCount = batchSize;

  const readControlsState = () => ({
    sortValue: sortSelect?.value ?? "",
    filters: getActiveFilters(filterInputs)
  });

  const applyStateToControls = (state) => {
    if (sortSelect) sortSelect.value = state?.sortValue ?? "";

    const selected = state?.filters ?? {
      industry: [],
      product: [],
      company_size: [],
      location: [],
      use_cases: []
    };

    filterInputs.forEach((input) => {
      const key = input.dataset.filterKey;
      if (!FILTER_KEYS.includes(key)) return;
      input.checked = (selected[key] ?? []).includes(input.value);
    });
  };

  let appliedState = readControlsState();
  let draftState = appliedState;

  const getSortedMatchingIds = (state) => {
    const filters = state.filters;

    const gridMatching = gridCards.filter((card) => matchesFilters(card, filters));
    const gridSorted = sortCardsByField(gridMatching, state.sortValue);
    const orderedIds = gridSorted.map((card) => card.dataset.id);
    const gridById = new Map(gridCards.map((c) => [c.dataset.id, c]));
    const listById = new Map(listCards.map((c) => [c.dataset.id, c]));

    orderedIds.forEach((id) => {
      const g = gridById.get(id);
      const l = listById.get(id);
      if (g) resultsGrid.append(g);
      if (l) resultsList.append(l);
    });

    return orderedIds;
  };

  const applyBatchVisibility = (orderedMatchingIds) => {
    const allowedIds = new Set(orderedMatchingIds.slice(0, visibleBatchCount));

    gridCards.forEach((card) => {
      card.hidden = !allowedIds.has(card.dataset.id);
    });

    listCards.forEach((card) => {
      card.hidden = !allowedIds.has(card.dataset.id);
    });

    if (loadMoreBtn) {
      const more = orderedMatchingIds.length > visibleBatchCount;
      loadMoreBtn.hidden = !more;
      loadMoreBtn.disabled = false;
    }
  };

  const refresh = () => {
    visibleBatchCount = batchSize;
    const orderedMatchingIds = getSortedMatchingIds(appliedState);
    applyBatchVisibility(orderedMatchingIds);
  };

  const loadMore = () => {
    const orderedMatchingIds = getSortedMatchingIds(appliedState);
    visibleBatchCount += batchSize;
    applyBatchVisibility(orderedMatchingIds);
  };

  const onControlsChange = () => {
    if (isDesktop()) {
      appliedState = readControlsState();
      refresh();
      return;
    }
    draftState = readControlsState();
  };

  filterInputs.forEach((input) => input.addEventListener("change", onControlsChange));
  sortSelect?.addEventListener("change", onControlsChange);
  loadMoreBtn?.addEventListener("click", loadMore);

  initCustomersMobileFilters(root, {
    onOpen: () => {
      if (isDesktop()) return;
      draftState = appliedState;
      applyStateToControls(draftState);
    },
    onClose: () => {
      if (isDesktop()) return;
      draftState = appliedState;
      applyStateToControls(appliedState);
    },
    onClear: () => {
      if (isDesktop()) {
        if (sortSelect) sortSelect.value = "";
        filterInputs.forEach((i) => (i.checked = false));
        appliedState = readControlsState();
        refresh();
        return;
      }
      if (sortSelect) sortSelect.value = "";
      filterInputs.forEach((i) => (i.checked = false));
      draftState = readControlsState();
    },
    onApply: () => {
      if (isDesktop()) return;
      appliedState = draftState;
      refresh();
    }
  });

  refresh();
}