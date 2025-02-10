import { trackEvent } from './segment-helpers';

export function hasAnswered() {
    return window.cookiehub.hasAnswered('advertising') ||
        window.cookiehub.hasAnswered('analytics') ||
        window.cookiehub.hasAnswered('preferences')
}

export function trackConsent(settings = {
    marketing: undefined,
    analytics: undefined,
    preferences: undefined
}) {
    trackEvent('segment_consent_preference_updated', undefined, {
        context: {
            consent: {
                properties: {
                    categoryPreferences: {
                        Advertising: settings.marketing || (cookiehub.hasAnswered('marketing') && cookiehub.hasConsented('marketing')),
                        Analytics: settings.analytics || (cookiehub.hasAnswered('analytics') && cookiehub.hasConsented('analytics')),
                        Functional: true,
                        Preferences: settings.preferences || (cookiehub.hasAnswered('preferences') && cookiehub.hasConsented('preferences')),
                    }
                }
            }
        }
    });
}
