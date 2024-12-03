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

    const gclid = urlParams.get('gclid');
    const utmParams = {
        source: urlParams.get('utm_source'),
        medium: urlParams.get('utm_medium'),
        campaign: urlParams.get('utm_campaign'),
        content: urlParams.get('utm_content')
    };

    const links = document.querySelectorAll('a[href*="cloud.qdrant.io"]');
    links.forEach(link => {
        const href = link.href;
        const separator = href.indexOf('?') === -1 ? '?' : '&';

        let newHref = `${href}${separator}${gclid ? 'gclid=' + gclid + '&' : ''}`;

        for (const key in utmParams) {
            if (utmParams[key]) {
                newHref += `utm_${key}=${utmParams[key]}&`;
            }
        }

        newHref = newHref.replace(/[&|?]$/, ''); // remove any trailing ampersands or question marks
        link.href = newHref;
    });
  }