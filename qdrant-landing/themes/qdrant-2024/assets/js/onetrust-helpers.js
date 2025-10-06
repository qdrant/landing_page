const CONSENT_PARAM_KEY = 'ot_consent';

export function registerAndCall() {
  const consentPreferences = window.OnetrustActiveGroups ?? '';

  // Register OneTrust Integration plugin
  window.analytics
    .register({
      name: 'OneTrust Integration Cookie',
      version: '0.1.0',
      type: 'enrichment',
      isLoaded: () => true,
      load: () => Promise.resolve(),
      // context object and reference to the analytics.js instance
      page: (ctx) => {
        if (ctx.event.context) {
          ctx.updateEvent('context.consent', { onetrust: consentPreferences });
        }
        return ctx;
      },
      track: (ctx) => {
        if (ctx.event.context) {
          ctx.updateEvent('context.consent', { onetrust: consentPreferences });
        }
        return ctx;
      },
      identify: (ctx) => {
        if (ctx.event.context) {
          ctx.updateEvent('context.consent', { onetrust: consentPreferences });
        }
        return ctx;
      },
    })
    .catch(() => false);

    return true;
  } // registerAndCall

export function setOneTrustDataSubjectId() {
  const analytics = window.analytics;
  const activeGroups = window.OnetrustActiveGroups;
  if (!analytics || !activeGroups) return;

  const anonymousId = analytics.user?.()?.anonymousId?.(); 
  if (!anonymousId) return;

  window.OneTrust.setDataSubjectId(anonymousId, true, 'AnonymousID');
}

export function addOneTrustPreferencesToLinks() {
  const activeGroups = window.OnetrustActiveGroups;
  
  if (!activeGroups || typeof activeGroups !== 'string') return;
  
  const links = document.querySelectorAll('a[href*="cloud.qdrant.io"]');

  links.forEach(link => {
    let url = new URL(link.href);
    
    if (url.searchParams.has(CONSENT_PARAM_KEY)) {
      url.searchParams.delete(CONSENT_PARAM_KEY);
    }

    url.searchParams.set(CONSENT_PARAM_KEY, activeGroups);

    link.href = url.toString();
  });
}