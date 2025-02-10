import * as params from '@params';
import { setCookie, getCookie, tagCloudUILinksWithAnonymousId } from './helpers';
import { hasAnswered, trackConsent } from './cookiehub-helpers';
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
    if (!getCookie('cookie-consent')) { // if cookit (old) cookie still present
        trackConsent({ marketing: true, analytics: true, preference: true})
        document.cookie = 'cookie-consent=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'; // remove cookie
    } else {
        if(!hasAnswered()) trackConsent(); // if user has not answered
    }
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
