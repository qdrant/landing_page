import * as params from '@params';
import { setCookie } from './helpers';
import { setSegmentWriteKey } from './segment-helpers';

document.addEventListener('DOMContentLoaded', () => {
    addUTMToLinks();
});

if (params.segmentWriteKey) {
    setSegmentWriteKey(params.segmentWriteKey);
}

if (params.gaMeasurementId) {
    setCookie('ga_measurement_id', params.gaMeasurementId, 365);
}

function addUTMToLinks() {
    const urlParams = new URLSearchParams(window.location.search);

    // Gather all GTM related params
    const utmIds = {
        gcl: urlParams.get('gclid'),
        gbra: urlParams.get('gbraid'),
        wbra: urlParams.get('wbraid'),
    };

    const utmParams = {
        source: urlParams.get('utm_source'),
        medium: urlParams.get('utm_medium'),
        campaign: urlParams.get('utm_campaign'),
        content: urlParams.get('utm_content')
    };

    // Create new params string for outbound links and store in sessionStorage
    let newParams = '';
    for (const key in utmIds) {
        if (utmIds[key]) {
            sessionStorage.setItem(`${key}id`, utmIds[key]);
            newParams += `${key}id=${utmIds[key]}&`;
        }
    }
    for (const key in utmParams) {
        if (utmParams[key]) {
            sessionStorage.setItem(`utm_${key}`, utmParams[key]);
            newParams += `utm_${key}=${utmParams[key]}&`;
        }
    }

    // Add url params to outbound links to product site
    if (newParams.length === 0) {
        newParams = newParams.replace(/[&|?]$/, ''); // remove trailing & or ?

        const links = document.querySelectorAll('a[href*="cloud.qdrant.io"]');
        links.forEach(link => {
            const href = link.href;
            const separator = href.indexOf('?') === -1 ? '?' : '&';
            link.href = `${href}${separator}${newParams}`;
        });
    }
  }