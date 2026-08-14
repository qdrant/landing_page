/**
 * Self-check for the OneTrust -> Consent Mode v2 mapping.
 * Run: node qdrant-landing/themes/qdrant-2024/assets/js/gtm-helpers.check.mjs
 *
 * Loaded via a data: URL because the theme has no test runner and no
 * "type": "module" — this keeps the check dependency-free.
 */
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./gtm-helpers.js', import.meta.url), 'utf8');
const { mapOneTrustConsent } = await import('data:text/javascript,' + encodeURIComponent(src));

// No consent yet: everything denied.
assert.deepEqual(mapOneTrustConsent(''), {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
});

// Strictly necessary only: still nothing granted.
assert.equal(mapOneTrustConsent(',C0001,').analytics_storage, 'denied');

// Performance grants analytics but not ads.
const performanceOnly = mapOneTrustConsent(',C0001,C0002,');
assert.equal(performanceOnly.analytics_storage, 'granted');
assert.equal(performanceOnly.ad_storage, 'denied');

// Targeting grants all three ad signals.
const targeting = mapOneTrustConsent(',C0001,C0004,');
assert.equal(targeting.ad_storage, 'granted');
assert.equal(targeting.ad_user_data, 'granted');
assert.equal(targeting.ad_personalization, 'granted');
assert.equal(targeting.analytics_storage, 'denied');

// Functional maps to both functionality and personalization storage.
const functional = mapOneTrustConsent(',C0003,');
assert.equal(functional.functionality_storage, 'granted');
assert.equal(functional.personalization_storage, 'granted');

// Full consent.
assert.deepEqual(mapOneTrustConsent(',C0001,C0002,C0003,C0004,'), {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
  functionality_storage: 'granted',
  personalization_storage: 'granted',
});

// Exact group matching: a longer ID must not satisfy a shorter one.
assert.equal(mapOneTrustConsent(',C00020,').analytics_storage, 'denied');

// Missing/undefined groups must not throw.
assert.equal(mapOneTrustConsent(undefined).analytics_storage, 'denied');

console.log('gtm-helpers: all consent mapping checks passed');
