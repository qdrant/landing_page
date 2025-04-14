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