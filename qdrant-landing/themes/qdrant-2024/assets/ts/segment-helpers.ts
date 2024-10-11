import { devLog, tagCloudUILinksWithAnonymousId } from '../js/helpers';
import { TrackEvent as TrackEventType} from '@qdrant/qdrant-analytics-events';
import { AnalyticsBrowser } from '@segment/analytics-next';
import type { AnalyticsSnippet } from "@segment/analytics-next";

// const analytics = AnalyticsBrowser.load(
//   { writeKey: 'FwEYAP1DrY9yTyojPI5F5PCokfDECQXZ'},
//   { 
//     batchSize: 1,      // For immediate event dispatch
//     flushInterval: 5000 // Flush every 5 seconds
//   });

const trackQueue: (() => void)[] = [];

interface PropertiesType {
  [key: string]: any;
};

declare global {
  interface Window {
      analytics: AnalyticsSnippet;
  }
}

const PAYLOAD_BOILERPLATE = {
  url: window.location.href,
  title: document.title,
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

  trackInteractionEvent(payload);
  
  // If element can be clicked more than once (ie user remains on same page)
  if (!event.target.hasAttribute('data-metric-keep')) {
    event.target.removeEventListener('click', handleClickInteraction);
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

function tagAllForms() {
  const forms = document.querySelectorAll('form');

  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      new FormData(form);
    });
  
    form.addEventListener("formdata", (e) => {
      let data = e.formData;
      let properties: PropertiesType = {};

      const entries = [...data.entries()];  

      entries.forEach((entry) => (properties[entry[0]] = entry[1]));
      properties.form_id = form.getAttribute("data-form-id");

      // trackEvent("form_submit", properties) //TODO: add event to dictionary, bump version, install
    });
  });
}

/****************/
/* Segment CRUD */
/****************/
function processQueue() {
  while (trackQueue.length > 0) {
    const trackCall = trackQueue.shift();
    if (trackCall) {
      trackCall();
    }
  }
}

window.onbeforeunload = () => {
  processQueue();
}

const trackEvent: TrackEventType = (eventName: string, eventPayload: PropertiesType = {}) => {  
  trackQueue.push(() => window.analytics.track(eventName, eventPayload));
  processQueue();
}

const trackInteractionEvent = (properties: PropertiesType = {}) => {
  trackEvent(
    'interaction',
    properties
  )
}

/***********/
/* Consent */
/***********/
export function handleConsent() {
  // trackEvent('Consented', PAYLOAD_BOILERPLATE)
  devLog('User consented...')
}

/********************/
/* Tag DOM Elements */
/********************/
document.body.addEventListener('customSegmentIsReady', () => {
  tagCloudUILinksWithAnonymousId();
  tagAllAnchors();
  tagAllForms();
}, false);
