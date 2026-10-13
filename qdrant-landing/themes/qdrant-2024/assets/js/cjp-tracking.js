import { trackAllClicksIn, trackScrollDepth, trackSectionViews } from './segment-helpers';

// ponytail: /cloud + the Customer Journey Pages only, so Segment volume elsewhere is untouched.
// Move to index.js to take it sitewide.
trackAllClicksIn(document);
trackScrollDepth();
trackSectionViews();
