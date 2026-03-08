/**
 * Synchronizes tab switching across tab groups that share the same data-tab-sync value.
 * Add data-tab-sync="group-id" to the tab container (parent of tab buttons).
 * Tab buttons must have data-tab with matching values across synchronized groups.
 * Programmatic clicks (isTrusted: false) are ignored to avoid sync loops.
 */
export function initTabSync() {
  document.addEventListener(
    'click',
    (e) => {
      if (!e.isTrusted) return;

      const tab = e.target.closest('[data-tab-sync] [data-tab]');
      if (!tab) return;

      const container = tab.closest('[data-tab-sync]');
      const syncGroup = container?.getAttribute('data-tab-sync');
      const tabId = tab.getAttribute('data-tab');
      if (!syncGroup || !tabId) return;

      document.querySelectorAll(`[data-tab-sync="${syncGroup}"]`).forEach((group) => {
        if (group === container) return;
        const matchingTab = group.querySelector(`[data-tab="${tabId}"]`);
        if (matchingTab) matchingTab.click();
      });
    },
    true,
  );
}
