import { devLog, tagCloudUILinksWithAnonymousId } from '../js/helpers';
import { TrackEvent as TrackEventType} from '@qdrant/qdrant-analytics-events';
import { AnalyticsBrowser } from "@segment/analytics-next";
import type { AnalyticsSnippet } from "@segment/analytics-next";

const metaElement = document.querySelector('meta[name="segment"]');
var segmentWriteKey = metaElement?.getAttribute('content') || "";
const analytics = AnalyticsBrowser.load({ writeKey: segmentWriteKey });

const trackQueue: (() => void)[] = [];

interface PropertiesType {
  [key: string]: any;
};

interface ContextType {
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
  let didSubmit = false;
  const forms = document.querySelectorAll('form');

  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      new FormData(form);
    });
  
    form.addEventListener("formdata", (e) => {
      let data = e.formData;
      let properties: PropertiesType = {};
      properties.source = "frontend";
 
      [...data.entries()].forEach((entry) => {
        if (entry[0].includes('email') && !entry[0].includes('password')) {
          properties[entry[0]] = entry[1]
        }
    });

      properties.form_id = form.getAttribute("data-form-id");

      if (!didSubmit) {
        didSubmit = true;
        trackEvent("form_submitted", properties);
        setTimeout(() => { didSubmit = false}, 500); // debounce
      }
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

const trackEvent: TrackEventType = (
  eventName: string,
  eventPayload: PropertiesType = {},
  eventContext?: ContextType
) => {  
  trackQueue.push(() => analytics.track(eventName, eventPayload, eventContext));
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
  const contextPayload = {
    consent: {
      categoryPreferences: {
        advertising: false, // regional conditionals
        analytics: true, 
        functional: true
      }
    }
  }

  trackEvent('segment_consent_preference_updated', PAYLOAD_BOILERPLATE, contextPayload)
  devLog('User consented...')
}

/********************/
/* Tag DOM Elements */
/********************/
analytics.ready(() => {
  analytics.page("Qdrant.tech", document.title);

  tagCloudUILinksWithAnonymousId();
  tagAllAnchors();
  tagAllForms();
});
