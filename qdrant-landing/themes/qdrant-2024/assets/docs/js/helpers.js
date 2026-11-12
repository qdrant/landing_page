export function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Open or close a product-scoped section or block (see product.js).
export function setProductScopedOpen(scoped, open) {
  scoped.classList.toggle('is-open', open);
  const toggle = scoped.querySelector(':scope > .product-scoped__note .product-scoped__toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(open));
  }
}

// Open every product-scoped section or block around an element, so a
// link into collapsed content can show its target.
export function revealProductScoped(el) {
  for (let scoped = el.closest('.product-scoped'); scoped; scoped = scoped.parentElement.closest('.product-scoped')) {
    setProductScopedOpen(scoped, true);
  }
}

export function scrollIntoViewWithOffset(id, offset) {
  offset = offset || 0;

  const target = document.getElementById(id);
  if (!target) return;
  revealProductScoped(target);

  const targetPosition = target.getBoundingClientRect().top - document.body.getBoundingClientRect().top - offset;

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

// Logging in Development Mode (localhost)
export function devLog(str) {
  if (window.location.host.includes('localhost')) {
    console.log(str)
  }
}
