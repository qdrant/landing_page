const UTM_PARAMS_KEY = 'utm_params';

export function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function scrollIntoViewWithOffset(id, offset) {
  offset = offset || 0;

  const targetPosition =
    document.getElementById(id).getBoundingClientRect().top - document.body.getBoundingClientRect().top - offset;

  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth',
  });
}

export function isNodeList(list) {
  return Object.prototype.isPrototypeOf.call(NodeList.prototype, list);
}

export function initGoToTopButton(selector) {
  const button = document.querySelector(selector || '.go-to-top');

  if (!button) {
    return;
  }

  window.addEventListener('scroll', () => {
    const shouldShow = window.scrollY > window.innerHeight / 3;
    button.classList.toggle('d-block', shouldShow);
    button.classList.toggle('d-none', !shouldShow);
  });

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// GET COOKIE
export function getCookie(name) {
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  name = name + "=";
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
}

// SET COOKIE
export function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + date.toUTCString();
  document.cookie = name + '=' + value + ';' + expires + ';path=/;Secure';
}

// Logging in Development Mode (localhost)
export function devLog(str) {
  if (window.location.host.includes('localhost')) {
    console.log(str)
  }
}

const CROSS_SITE_URL_PARAM_KEY = 'qdrant_tech_ajs_anonymous_id';
export function tagCloudUILinksWithAnonymousId() {
  const targetUrl = 'https://cloud.qdrant.io/';

  const anonymousId = analytics.user().anonymousId();
  
  // Function to add or update query parameter in the URL
  function addOrUpdateQueryParam(url, paramName, paramValue) {
    const urlObj = new URL(url, window.location.origin); // Ensures URL is absolute
    urlObj.searchParams.set(paramName, paramValue);
    return urlObj.toString();
  }

  // Select all <a> elements with href exactly containing targetUrl
  const links = document.querySelectorAll(`a[href^="${targetUrl}"]`);

  // Loop through all selected <a> elements and update their href
  links.forEach(link => {
    link.href = addOrUpdateQueryParam(link.href, CROSS_SITE_URL_PARAM_KEY, anonymousId);
  });
}

export function addGA4Properties(properties) {
  const gaMeasurementId = getCookie('ga_measurement_id')?.replace('G-', '');
  properties.ga_session_id = getCookie('_ga_' + gaMeasurementId)?.replace('GS1.1.','').split('.')[0];
  properties.ga_client_id = getCookie('_ga')?.replace('GA1.1.','');
}

export function persistUTMParams() {
  if (!window.location.search) return;

  const utmParams = getUTMParams();

  if (!Object.keys(utmParams).length) return;

  let filteredParams = '';
  let ampersand = false;

  for (const key in utmParams) {
    if (utmParams[key]) {
      ampersand = filteredParams.length;
      filteredParams += `${ampersand ? '&' : ''}${key}=${utmParams[key]}`;
    }
  }

  const oneYearInSeconds = 365 * 24 * 60 * 60;
  document.cookie = `${UTM_PARAMS_KEY}=${filteredParams}; path=/; max-age=${oneYearInSeconds}`;
}

export function getUTMParams() {
  const search = window.location.search;
  
  if (!search) return {};

  const urlParams = new URLSearchParams(search);

  return {
      gclid: urlParams.get('gclid'), //gcl
      gbraid: urlParams.get('gbraid'), //gbra
      wbraid: urlParams.get('wbraid'), //wbra
      utm_source: urlParams.get('utm_source'), //source
      utm_medium: urlParams.get('utm_medium'), //medium
      utm_campaign: urlParams.get('utm_campaign'), //campaign
      utm_content: urlParams.get('utm_content'), //content
      utm_term: urlParams.get('utm_term') //term
  };
}

export function addUTMToLinks() {
  const utmParams = getCookie(UTM_PARAMS_KEY);

  // Add url params to outbound links to product site
  if (utmParams) {
      const links = document.querySelectorAll('a[href*="cloud.qdrant.io"]');
      links.forEach(link => {
          const href = link.href;
          const separator = href.indexOf('?') === -1 ? '?' : '&';
          link.href = `${href}${separator}${utmParams}&qdrant_ref=qdrant_tech`;
      });
  }
}
