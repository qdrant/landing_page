/**
 * Synchronizes tab switching across tab groups that share the same data-tab-sync value.
 * Add data-tab-sync="group-id" to the tab container (parent of tab buttons).
 * Tab buttons must have data-tab with matching values across synchronized groups.
 * Programmatic clicks (isTrusted: false) are ignored to avoid sync loops.
 *
 * Optional data-tab-sync-direction:
 * - "down-only": only sync to tab groups that appear later in the DOM (below the clicked one).
 *   E.g. with A, B, C: A syncs B and C; B syncs C; C syncs none.
 *
 * @example Basic usage (bidirectional sync)
 * <div data-tab-sync="my-tabs">
 *   <button data-tab="cloud">Cloud</button>
 *   <button data-tab="on-prem">On-Premise</button>
 * </div>
 * <div data-tab-sync="my-tabs">
 *   <button data-tab="cloud">Cloud</button>
 *   <button data-tab="on-prem">On-Premise</button>
 * </div>
 *
 * @example Down-only (sync flows downward only)
 * <div data-tab-sync="pricing" data-tab-sync-direction="down-only">
 *   <button data-tab="cloud">Cloud</button>
 *   <button data-tab="on-prem">On-Premise</button>
 * </div>
 * <div data-tab-sync="pricing" data-tab-sync-direction="down-only">
 *   <button data-tab="cloud">Cloud</button>
 *   <button data-tab="on-prem">On-Premise</button>
 * </div>
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

      const groups = [...document.querySelectorAll(`[data-tab-sync="${syncGroup}"]`)];
      const hasDownOnly = groups.some((g) => g.getAttribute('data-tab-sync-direction') === 'down-only');

      const shouldSyncTo = (group) => {
        if (group === container) return false;
        if (hasDownOnly) {
          const groupIsBelow = !!(container.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING);
          if (!groupIsBelow) return false;
        }
        return true;
      };

      groups.forEach((group) => {
        if (!shouldSyncTo(group)) return;
        const matchingTab = group.querySelector(`[data-tab="${tabId}"]`);
        if (matchingTab) matchingTab.click();
      });
    },
    true,
  );
}
