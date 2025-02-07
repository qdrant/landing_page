import { trackEvent } from './segment-helpers';

export function hasAnswered() {
    return window.cookiehub.hasAnswered('advertising') ||
        window.cookiehub.hasAnswered('analytics') ||
        window.cookiehub.hasAnswered('preferences')
}

export function trackConsent() {
    // if first time tracking or updating consent
    // skip this IF consent hasn't changed and already tracked (may need a cookie to record )
    trackEvent('segment_consent_preference_updated', undefined, {
        context: {
            consent: {
                properties: {
                    categoryPreferences: {
                        Advertising: cookiehub.hasAnswered('marketing') && cookiehub.hasConsented('marketing'),
                        Analytics: cookiehub.hasAnswered('analytics') && cookiehub.hasConsented('analytics'),
                        Functional: true,
                        Preferences: cookiehub.hasAnswered('preferences') && cookiehub.hasConsented('preferences'),
                    }
                }
            }
        }
    });
}