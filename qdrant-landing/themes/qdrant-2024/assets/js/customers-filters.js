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

function initCustomersCaseStudies(root) {
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

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll("[data-customers-case-study]").forEach((root) => {
    initCustomersCaseStudies(root);
  });
})