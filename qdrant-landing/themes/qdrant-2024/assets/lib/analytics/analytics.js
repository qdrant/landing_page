// Analytics and consent for every page: UTM persistence, OneTrust consent
// changes, and Segment. Loaded by each part right before its own index.js, so it
// runs in the same order as when this code lived there. See README.md.
import { addUTMToLinks, persistUTMParams } from './tracking-helpers';
import { handleSegmentReady } from './segment-helpers';
import { addOneTrustPreferencesToLinks, registerAndCall } from './onetrust-helpers';

persistUTMParams();

// on document ready
document.addEventListener('DOMContentLoaded', function () {
  addUTMToLinks();

  const handleOneTrustLoaded = () => {
    // One Trust Loaded
    window.OneTrust.OnConsentChanged(async () => {
      // One Trust Preference Updated
      addOneTrustPreferencesToLinks();
      registerAndCall();

      await window.analytics.track('onetrust_consent_preference_updated', {
        onetrust_active_groups: window.OnetrustActiveGroups ?? '',
      });
    });

    handleSegmentReady();

    // Only called once ∴ remove once called
    document.removeEventListener('onetrust_loaded', handleOneTrustLoaded);
  };

  document.addEventListener('onetrust_loaded', handleOneTrustLoaded);
});
