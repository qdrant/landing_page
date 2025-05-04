import * as params from '@params';
import { setCookie, getCookie, tagCloudUILinksWithAnonymousId } from './helpers';
import { hasAnswered, trackConsent, tagCloudUILinksWithConsentSettings } from './cookiehub-helpers';
import { tagAllAnchors } from './segment-helpers';
import { addUTMToLinks } from './helpers';


document.addEventListener('DOMContentLoaded', () => {
    addUTMToLinks();
});

if (params.gaMeasurementId) {
    setCookie('ga_measurement_id', params.gaMeasurementId, 365);
}


// CookieHub Logic
let pageViewTracked = false;

document.addEventListener('cookie_hub_status_changed', () => {
    trackConsent();
});

// TODO: remove this once consent management is handled in Segment and always track pageView (see below)
document.addEventListener('cookie_hub_allowed_analytics', () => {
    if(!pageViewTracked && 'analytics' in window) {
        pageViewTracked = true;
        window.analytics.page();
    }
})

document.addEventListener('cookie_hub_initialized', () => {
    if (hasAnswered()) {
        tagCloudUILinksWithConsentSettings();
        return; // if user has answered CookieHub banner don't track consent
    }

    const consentPayload = getCookie('cookie-consent') ?
        { marketing: true, analytics: true, preference: true } : undefined;

    trackConsent(consentPayload);

    // removing the old cookit cookie implementation if stored
    document.cookie = 'cookie-consent=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

});

document.addEventListener('segment_loaded', () => {
    tagCloudUILinksWithAnonymousId();
    tagAllAnchors();

    // TODO: remove conditional when Segment is ready
    if(!pageViewTracked && 'cookiehub' in window && window.cookiehub.hasConsented('analytics')) {
        pageViewTracked = true;
        window.analytics.page();
    }
});
