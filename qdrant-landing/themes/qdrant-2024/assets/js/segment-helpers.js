import { devLog, tagCloudUILinksWithAnonymousId } from './helpers';

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
      let obj = {};
  
      const entries = [...data.entries()];
  
      entries.forEach((entry) => (obj[entry[0]] = entry[1]));
      obj.form_name=form.attributes[2].nodeValue

      trackEvent("form_submit", properties={ ...obj})
      // analytics.identify("lead form submit", obj);
    });
  });
}

/****************/
/* Segment CRUD */
/****************/
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

/********************/
/* Tag DOM Elements */
/********************/
document.body.addEventListener('customSegmentIsReady', () => {
  tagCloudUILinksWithAnonymousId();
  tagAllAnchors();
  tagAllForms();
}, false);
