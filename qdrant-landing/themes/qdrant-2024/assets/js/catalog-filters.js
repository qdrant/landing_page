const SORT_PARAM = "sort";
const SEARCH_PARAM = "q";
const DESKTOP_MIN_WIDTH = 992;

function getFilterKeys(root) {
  const fromAttr = (root.dataset.filterKeys ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  if (fromAttr.length) return fromAttr;

  return [
    ...new Set(
      [...root.querySelectorAll("[data-filter-input]")]
        .map((input) => input.dataset.filterKey)
        .filter(Boolean)
    )
  ];
}

function getMultiValueKeys(root) {
  return new Set(
    (root.dataset.multiValueKeys ?? "")
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean)
  );
}

function buildValidFilterValues(filterInputs, filterKeys) {
  return filterInputs.reduce((acc, input) => {
    const key = input.dataset.filterKey;
    if (!filterKeys.includes(key)) return acc;
    if (!acc[key]) acc[key] = new Set();
    acc[key].add(input.value);
    return acc;
  }, {});
}

function buildEmptyFilters(filterKeys) {
  return filterKeys.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});
}

function parseStateFromUrl(validFilterValues, filterKeys, validSortValues) {
  const params = new URLSearchParams(window.location.search);
  const sortParam = params.get(SORT_PARAM) ?? "";
  const sortValue = validSortValues.has(sortParam) ? sortParam : "";
  const searchQuery = (params.get(SEARCH_PARAM) ?? "").trim();

  const filters = buildEmptyFilters(filterKeys);

  for (const key of filterKeys) {
    const valid = validFilterValues[key] ?? new Set();
    const raw = params
      .getAll(key)
      .flatMap((value) => value.split(",").map((part) => part.trim()))
      .filter(Boolean);
    filters[key] = [...new Set(raw.filter((value) => valid.has(value)))];
  }

  return { sortValue, filters, searchQuery };
}

function syncStateToUrl(state, filterKeys) {
  const url = new URL(window.location.href);

  url.searchParams.delete(SORT_PARAM);
  if (state.sortValue) {
    url.searchParams.set(SORT_PARAM, state.sortValue);
  }

  url.searchParams.delete(SEARCH_PARAM);
  if (state.searchQuery) {
    url.searchParams.set(SEARCH_PARAM, state.searchQuery);
  }

  for (const key of filterKeys) {
    url.searchParams.delete(key);
    (state.filters[key] ?? []).forEach((value) => {
      url.searchParams.append(key, value);
    });
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

function hasActiveState(state, filterKeys) {
  return (
    Boolean(state.sortValue) ||
    Boolean(state.searchQuery) ||
    filterKeys.some((key) => (state.filters[key] ?? []).length > 0)
  );
}

function initViewToggle(root) {
  const bar = root.querySelector("[data-catalog-view-toggle], [data-customers-view-toggle]");
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

function getActiveFilters(filterInputs, filterKeys) {
  return filterInputs.reduce(
    (acc, input) => {
      if (!input.checked || input.hasAttribute("data-filter-all")) return acc;
      const key = input.dataset.filterKey;
      if (filterKeys.includes(key)) acc[key].push(input.value);
      return acc;
    },
    buildEmptyFilters(filterKeys)
  );
}

function matchesFilters(card, filters, filterKeys, multiValueKeys) {
  for (const key of filterKeys) {
    const selected = filters[key];
    if (!selected.length) continue;

    if (multiValueKeys.has(key)) {
      const cardValues = (card.dataset[key] ?? "").split("||").filter(Boolean);
      if (!selected.some((value) => cardValues.includes(value))) return false;
      continue;
    }

    const val = card.dataset[key] ?? "";
    if (!selected.includes(val)) return false;
  }
  return true;
}

function matchesSearch(card, searchQuery) {
  if (!searchQuery) return true;
  const haystack = (card.dataset.search ?? "").toLowerCase();
  return haystack.includes(searchQuery.toLowerCase());
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

function getAccordionHeaders(root) {
  return [
    ...root.querySelectorAll(
      "[data-catalog-accordion-header], .customers-case-studies__accordion-header, .demos-catalog__accordion-header"
    )
  ];
}

function getAccordionBodyClass(header) {
  if (header.hasAttribute("data-catalog-accordion-header")) {
    return null;
  }
  if (header.classList.contains("customers-case-studies__accordion-header")) {
    return "customers-case-studies__accordion-body";
  }
  if (header.classList.contains("demos-catalog__accordion-header")) {
    return "demos-catalog__accordion-body";
  }
  return null;
}

function closeAllFilterAccordions(root) {
  getAccordionHeaders(root).forEach((header) => {
    header.parentElement?.classList.remove("active");
    const panel = header.nextElementSibling;
    const bodyClass = getAccordionBodyClass(header);
    const isBody =
      panel &&
      (header.hasAttribute("data-catalog-accordion-header") ||
        (bodyClass && panel.classList.contains(bodyClass)));

    if (isBody) {
      panel.style.maxHeight = null;
    }
  });
}

function expandAccordionItem(item) {
  const header = item.querySelector(
    "[data-catalog-accordion-header], .customers-case-studies__accordion-header, .demos-catalog__accordion-header"
  );
  const panel = header?.nextElementSibling;
  const bodyClass = header ? getAccordionBodyClass(header) : null;
  const isBody =
    panel &&
    (header?.hasAttribute("data-catalog-accordion-header") ||
      (bodyClass && panel.classList.contains(bodyClass)));

  if (!header || !isBody) return;

  item.classList.add("active");
  panel.style.maxHeight = `${panel.scrollHeight}px`;
}

function syncAccordionExpansion(root, state, filterKeys) {
  root
    .querySelectorAll(
      "[data-catalog-accordion-item], .customers-case-studies__accordion-item, .demos-catalog__accordion-item"
    )
    .forEach((item) => {
      const sortSelect = item.querySelector("[data-sort-select]");
      const filterInputs = [...item.querySelectorAll("[data-filter-input]")];
      let shouldExpand = false;

      if (sortSelect) {
        shouldExpand = Boolean(state.sortValue);
      } else if (filterInputs.length) {
        const key = filterInputs[0].dataset.filterKey;
        shouldExpand = (state.filters[key] ?? []).length > 0;
      }

      if (shouldExpand) {
        expandAccordionItem(item);
      }
    });
}

function initAccordionToggle(root) {
  getAccordionHeaders(root).forEach((header) => {
    if (header.dataset.catalogAccordionBound) return;
    header.dataset.catalogAccordionBound = "true";
    header.addEventListener("click", () => {
      header.parentElement?.classList.toggle("active");
      const panel = header.nextElementSibling;
      const bodyClass = getAccordionBodyClass(header);
      const isBody =
        panel &&
        (header.hasAttribute("data-catalog-accordion-header") ||
          (bodyClass && panel.classList.contains(bodyClass)));
      if (!isBody) return;

      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });
}

function initMobileFilters(root, { onClose, onOpen, onApply, onClear, onAfterApply }) {
  const openBtn = root.querySelector(
    "[data-filters-open], .customers-case-studies__filter-mobile-button, .demos-catalog__filter-mobile-button"
  );
  const closeBtn = root.querySelector(
    "[data-filters-close], .customers-case-studies__filters-close-button, .demos-catalog__filters-close-button"
  );
  const applyBtn = root.querySelector(
    "[data-filters-apply], .customers-case-studies__filters-apply-button, .demos-catalog__filters-apply-button"
  );
  const clearBtn = root.querySelector(
    "[data-filters-clear], .customers-case-studies__filters-clear-button, .demos-catalog__filters-clear-button"
  );
  const panel = root.querySelector(
    "[data-filters], .customers-case-studies__filters, .demos-catalog__filters"
  );

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
    onAfterApply?.();
  });
  clearBtn?.addEventListener("click", () => onClear?.());
}

function syncAllCheckbox(filterInputs, filters, filterKeys) {
  const allInput = filterInputs.find((input) => input.hasAttribute("data-filter-all"));
  if (!allInput) return;

  const hasCategoryFilters = filterKeys.some((key) => (filters[key] ?? []).length > 0);
  allInput.checked = !hasCategoryFilters;
}

function handleAllCheckboxChange(changedInput, filterInputs) {
  if (!changedInput.hasAttribute("data-filter-all")) return false;

  if (changedInput.checked) {
    filterInputs.forEach((input) => {
      if (!input.hasAttribute("data-filter-all")) {
        input.checked = false;
      }
    });
  }
  return true;
}

function handleCategoryCheckboxChange(changedInput, filterInputs) {
  if (changedInput.hasAttribute("data-filter-all") || !changedInput.checked) return;

  filterInputs.forEach((input) => {
    if (input.hasAttribute("data-filter-all")) {
      input.checked = false;
    }
  });
}

function getCardSelector() {
  return "[data-catalog-card], [data-client-card]";
}

function initCatalogFilters(root) {
  initViewToggle(root);
  initAccordionToggle(root);

  const filterKeys = getFilterKeys(root);
  const multiValueKeys = getMultiValueKeys(root);
  const batchSize = Number(root.dataset.batchSize ?? 12) || 12;
  const resultsGrid = root.querySelector("[data-results-grid]");
  const resultsList = root.querySelector("[data-results-list]");
  const sortSelect = root.querySelector("[data-sort-select]");
  const searchInput = root.querySelector("[data-search-input]");
  const filterInputs = [...root.querySelectorAll("[data-filter-input]")];
  const loadMoreBtn = root.querySelector("[data-load-more]");

  if (!resultsGrid) return;

  const gridCards = [...resultsGrid.querySelectorAll(getCardSelector())];
  const listCards = resultsList
    ? [...resultsList.querySelectorAll(getCardSelector())]
    : [];
  const validFilterValues = buildValidFilterValues(filterInputs, filterKeys);
  const validSortValues = new Set(
    [...(sortSelect?.options ?? [])].map((option) => option.value).filter(Boolean)
  );

  let visibleBatchCount = batchSize;

  const readControlsState = () => ({
    sortValue: sortSelect?.value ?? "",
    searchQuery: (searchInput?.value ?? "").trim(),
    filters: getActiveFilters(filterInputs, filterKeys)
  });

  const applyStateToControls = (state) => {
    if (sortSelect) sortSelect.value = state?.sortValue ?? "";
    if (searchInput) searchInput.value = state?.searchQuery ?? "";

    const selected = state?.filters ?? buildEmptyFilters(filterKeys);

    filterInputs.forEach((input) => {
      if (input.hasAttribute("data-filter-all")) return;
      const key = input.dataset.filterKey;
      if (!filterKeys.includes(key)) return;
      input.checked = (selected[key] ?? []).includes(input.value);
    });

    syncAllCheckbox(filterInputs, selected, filterKeys);
  };

  let appliedState = readControlsState();
  let draftState = appliedState;

  const urlState = parseStateFromUrl(validFilterValues, filterKeys, validSortValues);
  if (hasActiveState(urlState, filterKeys)) {
    appliedState = urlState;
    draftState = urlState;
    applyStateToControls(appliedState);
    syncAccordionExpansion(root, appliedState, filterKeys);
  } else {
    syncAllCheckbox(filterInputs, appliedState.filters, filterKeys);
  }

  const commitAppliedState = () => {
    syncStateToUrl(appliedState, filterKeys);
    refresh();
    syncAccordionExpansion(root, appliedState, filterKeys);
  };

  const getSortedMatchingIds = (state) => {
    const matching = gridCards.filter(
      (card) =>
        matchesFilters(card, state.filters, filterKeys, multiValueKeys) &&
        matchesSearch(card, state.searchQuery)
    );
    const sorted = sortCardsByField(matching, state.sortValue);
    const orderedIds = sorted.map((card) => card.dataset.id);
    const gridById = new Map(gridCards.map((card) => [card.dataset.id, card]));
    const listById = new Map(listCards.map((card) => [card.dataset.id, card]));

    orderedIds.forEach((id) => {
      const gridCard = gridById.get(id);
      const listCard = listById.get(id);
      if (gridCard) resultsGrid.append(gridCard);
      if (listCard && resultsList) resultsList.append(listCard);
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

  const onControlsChange = (event) => {
    const changedInput = event?.target;

    if (changedInput?.matches?.("[data-filter-input]")) {
      handleAllCheckboxChange(changedInput, filterInputs);
      handleCategoryCheckboxChange(changedInput, filterInputs);
    }

    if (isDesktop()) {
      appliedState = readControlsState();
      commitAppliedState();
      return;
    }

    draftState = readControlsState();

    // Search applies immediately on mobile too
    if (changedInput === searchInput) {
      appliedState = { ...appliedState, searchQuery: draftState.searchQuery };
      commitAppliedState();
    }
  };

  filterInputs.forEach((input) => input.addEventListener("change", onControlsChange));
  sortSelect?.addEventListener("change", onControlsChange);
  searchInput?.addEventListener("input", onControlsChange);
  loadMoreBtn?.addEventListener("click", loadMore);

  initMobileFilters(root, {
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
      if (sortSelect) sortSelect.value = "";
      filterInputs.forEach((input) => {
        input.checked = input.hasAttribute("data-filter-all");
      });

      if (isDesktop()) {
        appliedState = readControlsState();
        commitAppliedState();
        return;
      }

      draftState = readControlsState();
    },
    onApply: () => {
      if (isDesktop()) return;
      appliedState = draftState;
      commitAppliedState();
    },
    onAfterApply: () => {
      if (isDesktop()) return;
      syncAccordionExpansion(root, appliedState, filterKeys);
    }
  });

  window.addEventListener("popstate", () => {
    const nextState = parseStateFromUrl(validFilterValues, filterKeys, validSortValues);
    appliedState = nextState;
    draftState = nextState;
    applyStateToControls(appliedState);
    refresh();
    syncAccordionExpansion(root, appliedState, filterKeys);
  });

  // Expand accordions marked active in markup (e.g. demos Categories)
  root
    .querySelectorAll(
      "[data-catalog-accordion-item].active, .customers-case-studies__accordion-item.active, .demos-catalog__accordion-item.active"
    )
    .forEach((item) => {
      expandAccordionItem(item);
    });

  refresh();
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll("[data-catalog-filters], [data-customers-case-study]")
    .forEach((root) => {
      initCatalogFilters(root);
    });
});
