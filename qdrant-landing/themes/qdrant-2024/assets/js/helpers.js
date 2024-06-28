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