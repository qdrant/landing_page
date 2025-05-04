import { trackEvent } from './segment-helpers';

export function hasAnswered() {
    return window.cookiehub.hasAnswered('marketing') ||
        window.cookiehub.hasAnswered('analytics') ||
        window.cookiehub.hasAnswered('preferences')
}

export function trackConsent(settings = {
    marketing: undefined,
    analytics: undefined,
    preferences: undefined
}) {
    tagCloudUILinksWithConsentSettings();

    const categoryPreferences = {
        Advertising: settings.marketing || (cookiehub.hasAnswered('marketing') && cookiehub.hasConsented('marketing')),
        Analytics: settings.analytics || (cookiehub.hasAnswered('analytics') && cookiehub.hasConsented('analytics')),
        Functional: true,
        Preferences: settings.preferences || (cookiehub.hasAnswered('preferences') && cookiehub.hasConsented('preferences')),
    }

    trackEvent('segment_consent_preference_updated', undefined, {
        context: {
            consent: {
                properties: { categoryPreferences }
            }
        }
    });

    console.log('segment_consent_preference_updated', categoryPreferences)
}

function createConsentParams() {
    return (window.cookiehub.hasConsented('marketing') ? 'm' : '') +
        (window.cookiehub.hasConsented('analytics') ? 'a' : '') +
        (window.cookiehub.hasConsented('preferences') ? 'p' : '')
}

export function tagCloudUILinksWithConsentSettings() {
    if (!hasAnswered()) return;

    const targetUrl = 'https://cloud.qdrant.io/';
    
    // Function to add or update query parameter in the URL
    function addOrUpdateQueryParam(url, paramName, paramValue) {
        const urlObj = new URL(url, window.location.origin); // Ensures URL is absolute
        urlObj.searchParams.set(paramName, paramValue);
        return urlObj.toString();
    }

    // Select all <a> elements with href exactly containing targetUrl
    const links = document.querySelectorAll(`a[href^="${targetUrl}"]`);

    // Loop through all selected <a> elements and update their href
    links.forEach(link => {
        link.href = addOrUpdateQueryParam(link.href, 'cookiehub', createConsentParams());
    });
}
