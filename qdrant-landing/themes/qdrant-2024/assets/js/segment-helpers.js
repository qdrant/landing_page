import { getCookie } from './helpers';

const WRITE_KEY='****';
const PAGES_SESSION_STORAGE_KEY = 'segmentPages';
const INTERACTIONS_SESSION_STORAGE_KEY = 'segmentInteractions';

const nameMapper = (url) => {
  return url.includes('/blog/') ? 'Blog' : 'Marketing Site';
}

/***************/
/* DOM helpers */
/***************/
const handleClickInteraction = (event) => {
  console.log('click', event.target)
  const payload = {
    url: window.location.href,
    title: document.title,
    location: event.target.getAttribute('data-metric-loc') ?? '',
    label: event.target.getAttribute('data-metric-label') ?? event.target.innerText,
    action: 'clicked'
  };

  if(getCookie('cookie-consent')) {
    trackInteractionEvent(payload);
    
    if (!event.target.hasAttribute('data-metric-keep')) {
      event.target.removeEventListener('click', handleClickInteraction);
    }
  } else {
    createSegmentStoredInteraction(payload);
  }
  
}

export function tagAllAnchors() {
  const allMetricsAnchors= document.querySelectorAll('a[data-metric-loc]');

  console.log('allMetricsAnchors', allMetricsAnchors)
  allMetricsAnchors.forEach(anchor => {
    anchor.addEventListener('click', handleClickInteraction, false);
  })
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
  const url = window.location.href;
  const title = document.title;
  const now = new Date();
  now.setFullYear(now.getFullYear() - 1)
  const timestamp = now;

  const existingPages = JSON.parse(sessionStorage.getItem(PAGES_SESSION_STORAGE_KEY) || '[]');
  const updatedPages = [...existingPages, { url, title, timestamp}];
  sessionStorage.setItem(PAGES_SESSION_STORAGE_KEY, JSON.stringify(updatedPages));
};

export function createSegmentStoredInteraction(payload) { // Create and Queue Interaction Entry
  const timestamp = new Date();
  const existingInteractions = JSON.parse(sessionStorage.getItem(INTERACTIONS_SESSION_STORAGE_KEY) || '[]');
  const updatedInteractions = [...existingInteractions, { ...payload, timestamp}];
  sessionStorage.setItem(INTERACTIONS_SESSION_STORAGE_KEY, JSON.stringify(updatedInteractions));
};


/******************/
/* Tracking Logic */
/******************/
const trackPageViews = () => {
  const category = 'Qdrant.tech';

  // Iterate over all stored page views
  getSegmentStoredPages().forEach(page => {
    const name = nameMapper(page.url);
    const properties = {
      url: page.url,
      title: page.title,
      timestamp: page.timestamp
    };
    const timestamp = page.timestamp;

    window.analytics.page(
      category,
      name,
      properties,
      timestamp
    );
  });
  
  removeSegmentStoredPages();
}

const trackStoredInteractions = () => {
  // Iterate over all stored page views
  getSegmentStoredInteractions().forEach(interaction => {
    const payload = JSON.parse(interaction)
    trackInteractionEvent(payload);
  });
  
  removeSegmentStoredPages();
}

const trackEvent = (name, properties = {}) => {
  window.analytics.track({
    event: name,
    properties
  })
}

const trackInteractionEvent = (properties = {}) => {
  trackEvent('Interaction', properties)
}

/***********/
/* Consent */
/***********/
export function handleConsent() {
  trackEvent('Consented')
  console.log('handleConsent')
}

/*******************/
/* Loading Segment */
/*******************/
export function loadSegment() {
  if (window.location.host === 'localhost:1313') {
    console.log('loading Segment...');
  }

  // Load Segment
  var i="analytics",analytics=window[i]=window[i]||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];analytics.factory=function(e){return function(){if(window[i].initialized)return window[i][e].apply(window[i],arguments);var n=Array.prototype.slice.call(arguments);if(["track","screen","alias","group","page","identify"].indexOf(e)>-1){var c=document.querySelector("link[rel='canonical']");n.push({__t:"bpc",c:c&&c.getAttribute("href")||void 0,p:location.pathname,u:location.href,s:location.search,t:document.title,r:document.referrer})}n.unshift(e);analytics.push(n);return analytics}};for(var n=0;n<analytics.methods.length;n++){var key=analytics.methods[n];analytics[key]=analytics.factory(key)}analytics.load=function(key,n){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute("data-global-segment-analytics-key",i);t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r);analytics._loadOptions=n};analytics._writeKey="Ze0ULGZFD55eSQt4cQAsR86yLk4PTvDH";;analytics.SNIPPET_VERSION="5.2.0";
  analytics.load(WRITE_KEY);
  }

  // Track any pages that may have been visited and stored in session storage
  trackPageViews();
};