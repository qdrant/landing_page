import { getCookie } from './helpers';

export function registerAndCall() {
    // No Cookie Failsafe
    let consent_onetrust = '';

    // Grab OptanonConsent cookie value
    let cookie_OptanonConsent = getCookie('OptanonConsent');
    if (typeof cookie_OptanonConsent !== 'undefined') {
      cookie_OptanonConsent = decodeURIComponent(cookie_OptanonConsent);
      // Get 'groups' from OptanonConsent cookie
      if (cookie_OptanonConsent.includes('&groups=')) {
        consent_onetrust = cookie_OptanonConsent
          .split('&groups=')[1]
          .split('&')
          .filter((item) => item !== '')
          .join(', ');
      }
    }

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
            ctx.updateEvent((ctx.event.context.consent = { onetrust: consent_onetrust }));
          }
          return ctx;
        },
        track: (ctx) => {
          if (ctx.event.context) {
            ctx.updateEvent((ctx.event.context.consent = { onetrust: consent_onetrust }));
          }
          return ctx;
        },
        identify: (ctx) => {
          if (ctx.event.context) {
            ctx.updateEvent((ctx.event.context.consent = { onetrust: consent_onetrust }));
          }
          return ctx;
        },
      })
      .catch(() => false);

    return true;
  } // registerAndCall