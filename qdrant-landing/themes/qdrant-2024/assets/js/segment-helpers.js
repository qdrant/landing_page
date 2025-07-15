import { addGA4Properties, addUTMToLinks, getCookie, getUTMParams, tagCloudUILinksWithAnonymousId } from './helpers';
import { registerAndCall } from './onetrust-helpers';

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

/****************/
/* Segment CRUD */
/****************/
// Getters
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
const trackPageView = () => {
  const category = 'Qdrant.tech';
  const name = nameMapper(window.location.href);
  
  const isFirstPageView = localStorage.getItem('isFirstPageView');
  const properties = {
    isFirstPageView,
    hubspotutk: getCookie('hubspotutk'),
  };
  addGA4Properties(properties);

  window.analytics.page(category, name, properties);
  
  removeSegmentStoredPages(); // TODO: Remove this end of April 2025
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

  addGA4Properties(properties);

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

/************************/
/* Handle Segment Ready */
/************************/
export function handleSegmentReady() {
  addUTMToLinks();

  analytics.ready(() => {
    const [utmIds, utmParams] = getUTMParams();
    const isFirstPageView = localStorage.getItem('isFirstPageView');

    if (isFirstPageView === 'true') {
      analytics.identify({
        firstVisitAttribution: {
          referrer: document.referrer,
          ...utmParams,
          ...utmIds
        },
        hubspotutk: getCookie('hubspotutk'),
      });
    }

    registerAndCall();
    tagCloudUILinksWithAnonymousId();
    tagAllAnchors();

    trackPageView();

    // TODO: simplify this now that we load Segment by default
    // Track any pages/interactions that may have been visited and stored in session storage
    trackStoredInteractions();
  });
};