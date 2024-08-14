import { getCookie, devLog, tagCloudUILinksWithAnonymousId } from './helpers';

const WRITE_KEY = 'segmentWriteKey';
const PAGES_SESSION_STORAGE_KEY = 'segmentPages';
const INTERACTIONS_SESSION_STORAGE_KEY = 'segmentInteractions';
const PAYLOAD_BOILERPLATE = {
  url: window.location.href,
  title: document.title,
};

/*******************/
/* General helpers */
/*******************/
const storedPayload = () => {
  if (getCookie('cookie-consent')) {
    return PAYLOAD_BOILERPLATE;
  }

  const now = new Date();
  return {
    ...PAYLOAD_BOILERPLATE,
    storedEvent: true,
    storedTimestamp: now.toISOString(),
  }
};

const nameMapper = (url) => { // Mapping names based on pathname for Segment
  return url.includes('/blog/') ? 'Blog' : 'Marketing Site';
};


/***************/
/* DOM helpers */
/***************/
const handleClickInteraction = (event) => {
  const payload = {
    ...PAYLOAD_BOILERPLATE,
    location: event.target.getAttribute('data-metric-loc') ?? '',
    label: event.target.getAttribute('data-metric-label') ?? event.target.innerText,
    action: 'clicked'
  };

  // If consented to tracking the track 
  if(getCookie('cookie-consent')) {
    trackInteractionEvent(payload);
    
    // If element can be clicked more than once (ie user remains on same page)
    if (!event.target.hasAttribute('data-metric-keep')) {
      event.target.removeEventListener('click', handleClickInteraction);
    }
  } else { // If no consent yet the store in sessionStorage in case of later consent
    createSegmentStoredInteraction(payload);
  }
};

// Gather all <a> elements that have been tagged 
// for tracking via 'data-metric-loc' attribute
function tagAllAnchors() {
  const allMetricsAnchors= document.querySelectorAll('a[data-metric-loc]');

  if (allMetricsAnchors) {
    allMetricsAnchors.forEach(anchor => {
      anchor.addEventListener('click', handleClickInteraction, false);
    })
  }
}

// Segment Key Getter & Setter
const getSegmentWriteKey = () => {
  return JSON.parse(sessionStorage.getItem(WRITE_KEY));
}
export const setSegmentWriteKey = (segmentWriteKey) => {
  sessionStorage.setItem(WRITE_KEY, JSON.stringify(segmentWriteKey));
}

/****************/
/* Segment CRUD */
/****************/
// Getters
const getSegmentStoredPages = () => { // Get Page Entires
  return JSON.parse(sessionStorage.getItem(PAGES_SESSION_STORAGE_KEY) || '[]');
};
const getSegmentStoredInteractions = () => { // Get Interaction Entires
  return JSON.parse(sessionStorage.getItem(INTERACTIONS_SESSION_STORAGE_KEY) || '[]');
};

// Deletions
const removeSegmentStoredPages = () => { // Remove Page Entires
  sessionStorage.removeItem(PAGES_SESSION_STORAGE_KEY);
};
const removeSegmentStoredInteractions = () => { // Remove Interaction Entires
  sessionStorage.removeItem(INTERACTIONS_SESSION_STORAGE_KEY);
};

// Create and Queue
export function createSegmentStoredPage() { // Create and Queue Page Entry
  const payload = storedPayload();

  const existingPages = JSON.parse(sessionStorage.getItem(PAGES_SESSION_STORAGE_KEY) || '[]');
  const updatedPages = [...existingPages, payload];
  sessionStorage.setItem(PAGES_SESSION_STORAGE_KEY, JSON.stringify(updatedPages));
};

export function createSegmentStoredInteraction(payload) { // Create and Queue Interaction Entry
  const updatedPayload = {
    ...payload,
    ...storedPayload()
  };

  const existingInteractions = JSON.parse(sessionStorage.getItem(INTERACTIONS_SESSION_STORAGE_KEY) || '[]');
  const updatedInteractions = [...existingInteractions, updatedPayload];
  sessionStorage.setItem(INTERACTIONS_SESSION_STORAGE_KEY, JSON.stringify(updatedInteractions));
};


/******************/
/* Tracking Logic */
/******************/
const trackStoredPageViews = () => {
  const category = 'Qdrant.tech';

  // Iterate over all stored page views
  getSegmentStoredPages().forEach(properties => {
    const name = nameMapper(properties.url);
    const originalTimestamp = properties.storedEvent ? properties.storedTimestamp : null;
    delete properties['storedTimestamp'];

    if(window.analytics) {
      window.analytics.page(
        category,
        name,
        properties,
        originalTimestamp ? { timestamp: originalTimestamp } : null
      );
    }
  });
  
  removeSegmentStoredPages();
}

const trackStoredInteractions = () => {
  // Iterate over all stored interactions
  getSegmentStoredInteractions().forEach(interactionPayload => {
    trackInteractionEvent(interactionPayload);
  });
  
  removeSegmentStoredInteractions();
}

const trackEvent = (name, properties = {}) => {
  const originalTimestamp = properties.storedEvent ? properties.storedTimestamp : null;
  delete properties['storedTimestamp'];

  if(window.analytics) {
    window.analytics.track({
      event: name,
      properties
    }, 
    originalTimestamp ? { timestamp: originalTimestamp } : null
    )
  }
}

const trackInteractionEvent = (properties = {}) => {
  trackEvent(
    'interaction',
    properties
  )
}

/***********/
/* Consent */
/***********/
export function handleConsent() {
  trackEvent('Consented', PAYLOAD_BOILERPLATE)
  devLog('User consented...')
}

/*******************/
/* Loading Segment */
/*******************/
export function loadSegment() {
  const writeKey = getSegmentWriteKey();
  if (!writeKey) return; // Fail silently?

  devLog('Loading Segment...');

  // Segment snippet initialization
  var i = "analytics",
    analytics = window[i] = window[i] || [];

  if (!analytics.initialize) {
    if (analytics.invoked) {
      window.console && console.error && console.error("Segment snippet included twice.");
    } else {
      analytics.invoked = true;
      analytics.methods = [
        "trackSubmit", "trackClick", "trackLink", "trackForm", "pageview", "identify", "reset", "group", "track",
        "ready", "alias", "debug", "page", "screen", "once", "off", "on", "addSourceMiddleware", "addIntegrationMiddleware",
        "setAnonymousId", "addDestinationMiddleware", "register"
      ];

      analytics.factory = function(e) {
        return function() {
          if (window[i].initialized) {
            return window[i][e].apply(window[i], arguments);
          }

          var n = Array.prototype.slice.call(arguments);
          if (["track", "screen", "alias", "group", "page", "identify"].indexOf(e) > -1) {
            var c = document.querySelector("link[rel='canonical']");
            n.push({
              __t: "bpc",
              c: c && c.getAttribute("href") || void 0,
              p: location.pathname,
              u: location.href,
              s: location.search,
              t: document.title,
              r: document.referrer
            });
          }

          n.unshift(e);
          analytics.push(n);
          return analytics;
        }
      };

      for (var n = 0; n < analytics.methods.length; n++) {
        var key = analytics.methods[n];
        analytics[key] = analytics.factory(key);
      }

      analytics.load = function(key, n) {
        var t = document.createElement("script");
        t.type = "text/javascript";
        t.async = true;
        t.setAttribute("data-global-segment-analytics-key", i);
        t.src = "https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";
        var r = document.getElementsByTagName("script")[0];
        r.parentNode.insertBefore(t, r);
        analytics._loadOptions = n;
      };

      analytics._writeKey = writeKey;
      analytics.SNIPPET_VERSION = "5.2.0";
      analytics.load(writeKey);

      analytics.ready(function() {
        tagCloudUILinksWithAnonymousId();
        tagAllAnchors();
      });
    }
  }

  // Track any pages that may have been visited and stored in session storage
  trackStoredPageViews();
  trackStoredInteractions();
};