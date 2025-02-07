import { addGA4Properties, getCookie, devLog, tagCloudUILinksWithAnonymousId } from './helpers';

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
  if('cookiehub' in window && window.cookiehub.hasConsented('analytics')) {
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
export function tagAllAnchors() {
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
export const trackEvent = (name, properties = {}, options = {}) => {
  addGA4Properties(properties);

  if(window.analytics) {
    window.analytics.track({
      event: name,
      properties
    }, 
    options)
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
