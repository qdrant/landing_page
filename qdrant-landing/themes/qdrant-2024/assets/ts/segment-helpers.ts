import { devLog, tagCloudUILinksWithAnonymousId } from '../js/helpers';
import { TrackEvent as TrackEventType} from '@qdrant/qdrant-analytics-events';

const PAYLOAD_BOILERPLATE = {
  url: window.location.href,
  title: document.title,
};

interface PropertiesType {
  [key: string]: any;
}

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

      // trackEvent("form_submit", properties) TODO: add event to dictionary, bump version, install
    });
  });
}

/****************/
/* Segment CRUD */
/****************/
const trackEvent: TrackEventType = (eventName, eventPayload = {}) => {
  if((window as any).analytics) {
    (window as any).analytics.track({
      event: eventName,
      properties: eventPayload
    })
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
