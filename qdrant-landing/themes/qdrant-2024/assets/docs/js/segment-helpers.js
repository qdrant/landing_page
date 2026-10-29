import { addGA4Properties, getCookie, getUTMParams, tagCloudUILinksWithAnonymousId } from './helpers';
import { registerAndCall, setOneTrustDataSubjectId } from './onetrust-helpers';

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
const LABEL_MAX = 120;

// Fall back to the nearest landmark when an element carries no data-metric-loc,
// so untagged clicks still land in a readable bucket ('cloud_hero', 'footer', ...).
const deriveLocation = (el) => {
  // No 'nav' here on purpose: a <nav> nested in the footer would otherwise split
  // footer clicks into its own bucket.
  const region = el.closest('section, header, footer');
  if (!region) return 'page';

  const cls = [...region.classList].find((c) => c && !/^(col|row|g|container)([-_]|$)/.test(c));
  return (cls || region.tagName.toLowerCase())
    .replace(/^qdrant-cloud-/, 'cloud-')
    .replace(/[^a-z0-9]+/gi, '_')
    .toLowerCase();
};

// || not ??: an icon-only link has innerText '' and needs to fall through to the image alt.
const deriveLabel = (el) =>
  el.getAttribute('data-metric-label')
  || el.getAttribute('aria-label')
  || el.innerText
  || el.querySelector('img[alt]')?.getAttribute('alt')
  || el.getAttribute('title')
  || el.getAttribute('href')
  || '';

const emitInteraction = (payload) => {
  // If consented to tracking the track
  if (getCookie('cookie-consent')) {
    trackInteractionEvent(payload);
  } else { // If no consent yet the store in sessionStorage in case of later consent
    createSegmentStoredInteraction(payload);
  }
};

const trackClickOn = (el) => {
  const rawLabel = deriveLabel(el);
  const cleanedLabel = rawLabel ? rawLabel.replace(/\s+/g, ' ').trim().slice(0, LABEL_MAX) : '';
  const href = el.getAttribute('href') ?? '';

  emitInteraction({
    ...PAYLOAD_BOILERPLATE,
    location: el.getAttribute('data-metric-loc') ?? deriveLocation(el),
    label: cleanedLabel,
    action: 'clicked',
    href,
    outbound: /^https?:\/\//.test(href) && !href.includes(window.location.host),
  });
};

const handleClickInteraction = (event) => {
  // currentTarget, not target: the tagged element is where the listener was attached,
  // while target is the innermost node clicked (an <img>/<p> inside a card anchor).
  const el = event.currentTarget;
  trackClickOn(el);

  // If element can be clicked more than once (ie user remains on same page)
  if (getCookie('cookie-consent') && !el.hasAttribute('data-metric-keep')) {
    el.removeEventListener('click', handleClickInteraction);
  }
};

// GA4 Enhanced Measurement only reports 90%, so fire the quarters ourselves.
const SCROLL_MILESTONES = [25, 50, 75, 90];

// Fires each milestone at most once per page load, plus the deepest point on the way out.
export function trackScrollDepth(milestones = SCROLL_MILESTONES) {
  const pending = new Set(milestones);
  const startedAt = performance.now();
  const sinceLoad = () => Math.round(performance.now() - startedAt);
  let queued = false;
  let deepest = 0;
  let reportedDeepest = false;

  const check = () => {
    queued = false;

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    // Page fits the viewport, so there is no scrolling to measure.
    if (scrollable <= 0) return;

    const percent = (window.scrollY / scrollable) * 100;
    deepest = Math.max(deepest, Math.min(100, Math.round(percent)));

    // Sorted so a single jump (anchor link, restored position) reports in order.
    [...pending].sort((a, b) => a - b).forEach((milestone) => {
      if (percent < milestone) return;

      pending.delete(milestone);
      emitInteraction({
        ...PAYLOAD_BOILERPLATE,
        location: 'page',
        label: `${milestone}%`,
        action: 'scrolled',
        percent: milestone,
        ms_to_reach: sinceLoad(),
      });
    });
  };

  // Coalesce to one measurement per frame; scroll fires far more often than that.
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(check);
  };

  // Deepest point reached, which is the only depth we get from visitors who
  // leave without crossing a milestone.
  const reportDeepest = () => {
    if (reportedDeepest || !deepest) return;
    reportedDeepest = true;

    emitInteraction({
      ...PAYLOAD_BOILERPLATE,
      location: 'page',
      label: `${deepest}%`,
      action: 'scroll_max',
      percent: deepest,
      ms_to_reach: sinceLoad(),
    });
  };

  // The listener stays attached after the last milestone: deepest still needs updating.
  window.addEventListener('scroll', onScroll, { passive: true });

  // ponytail: best-effort on the way out, a request started here can still be dropped.
  // visibilitychange covers mobile, where pagehide does not reliably fire.
  window.addEventListener('pagehide', reportDeepest);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reportDeepest();
  });

  check(); // page may already be loaded part-way down
}

// Which sections a visitor actually reached, which a page-level percentage only implies.
export function trackSectionViews(selector = 'section') {
  const sections = [...document.querySelectorAll(selector)];
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        observer.unobserve(entry.target); // once per section per page load

        const location = deriveLocation(entry.target);

        // Skip OneTrust consent markup, and unclassed wrappers that would otherwise
        // land in a meaningless bucket named after the tag.
        if (location.startsWith('ot_') || location === entry.target.tagName.toLowerCase()) return;

        const heading = entry.target.querySelector('h1, h2, h3, h4');
        emitInteraction({
          ...PAYLOAD_BOILERPLATE,
          location,
          label: heading ? heading.innerText.replace(/\s+/g, ' ').trim().slice(0, LABEL_MAX) : '',
          action: 'viewed',
        });
      });
    },
    // ponytail: a quarter of the section counts as seen. A higher threshold would
    // never trigger for tall sections on small screens.
    { threshold: 0.25 },
  );

  sections.forEach((section) => observer.observe(section));
}

// Track every link/button under root, not just the data-metric-loc ones.
// Delegated so elements added after load are covered too.
export function trackAllClicksIn(root) {
  root.addEventListener('click', (event) => {
    const el = event.target.closest('a, button');

    // Explicitly tagged elements have their own listener via tagAllAnchors()
    if (!el || !root.contains(el) || el.hasAttribute('data-metric-loc')) return;

    trackClickOn(el);
  });
}

// Gather all <a> and <button> elements that have been tagged
// for tracking via 'data-metric-loc' attribute
function tagAllAnchors() {
  const allMetricsAnchors= document.querySelectorAll('a[data-metric-loc], button[data-metric-loc]');

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

function cleanSegmentUtmKeys(obj) {
  const cleanedObject = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Remove "id" from the end
      let cleanedKey = key.replace(/id$/, '');

      // Remove "utm_" from the beginning
      cleanedKey = cleanedKey.replace(/^utm_/, '');

      cleanedObject[cleanedKey] = obj[key];
    }
  }
  return cleanedObject;
}


/************************/
/* Handle Segment Ready */
/************************/
export function handleSegmentReady() {
  analytics.ready(() => {
    setOneTrustDataSubjectId();

    const utmParams = getUTMParams()
    const cleanUtmParams = cleanSegmentUtmKeys(utmParams);

    const isFirstPageView = localStorage.getItem('isFirstPageView');

    if (isFirstPageView === 'true') {
      analytics.identify({
        firstVisitAttribution: {
          referrer: document.referrer,
          ...cleanUtmParams
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