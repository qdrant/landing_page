/**
 * Bridges OneTrust consent choices onto Google Consent Mode v2 signals for GTM.
 *
 * The GTM container is loaded in partials/js.html with every consent signal
 * defaulted to 'denied'. Nothing in the container fires until updateGtmConsent()
 * pushes an update, which happens once OneTrust reports its stored choice and
 * again on every preference change (see index.js).
 *
 * Group IDs below are the OneTrust defaults. If the OneTrust console for
 * qdrant.tech uses custom group IDs, these constants are the only thing to change.
 */
const OT_GROUP = {
  PERFORMANCE: 'C0002',
  FUNCTIONAL: 'C0003',
  TARGETING: 'C0004',
};

/**
 * OneTrust exposes consent as a delimited string, e.g. ',C0001,C0002,'.
 * Split rather than substring-match so 'C0002' never matches 'C00020'.
 */
export function mapOneTrustConsent(activeGroups) {
  const groups = (activeGroups ?? '').split(',');
  const performance = groups.includes(OT_GROUP.PERFORMANCE);
  const functional = groups.includes(OT_GROUP.FUNCTIONAL);
  const targeting = groups.includes(OT_GROUP.TARGETING);

  return {
    ad_storage: targeting ? 'granted' : 'denied',
    ad_user_data: targeting ? 'granted' : 'denied',
    ad_personalization: targeting ? 'granted' : 'denied',
    analytics_storage: performance ? 'granted' : 'denied',
    functionality_storage: functional ? 'granted' : 'denied',
    personalization_storage: functional ? 'granted' : 'denied',
  };
}

export function updateGtmConsent() {
  // gtag is only defined when the container is configured (production w/ a container ID)
  if (typeof window.gtag !== 'function') return;

  window.gtag('consent', 'update', mapOneTrustConsent(window.OnetrustActiveGroups));
}
