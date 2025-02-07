import * as params from '@params';
import { setCookie, tagCloudUILinksWithAnonymousId } from './helpers';
import { hasAnswered, trackConsent } from './cookiehub-helpers';
import { tagAllAnchors } from './segment-helpers';
import { addUTMToLinks } from './helpers';


document.addEventListener('DOMContentLoaded', () => {
    addUTMToLinks();
});

// Can perhaps move his without depending on analytics readiness
window.analytics.ready(() => {
    tagCloudUILinksWithAnonymousId();
    tagAllAnchors();
})

if (params.gaMeasurementId) {
    setCookie('ga_measurement_id', params.gaMeasurementId, 365);
}

let ct = 0;
const cookieHubLoadCheck = setInterval(() => {
    if (ct > 50) clearInterval(cookieHubLoadCheck);

    if ('cookiehub' in window) {
        clearInterval(cookieHubLoadCheck);

        if(!hasAnswered()) trackConsent(); // initial consent tracking
        document.addEventListener("cookie_hub_status_changed", trackConsent);

        if ('analytics' in window && hasAnswered() && cookiehub.hasConsented('analytics')) {
            window.analytics.page();
        }
    }
    ct++;
}, 100);
