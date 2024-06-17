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
    if (window.scrollY > window.innerHeight / 3) {
      button.classList.add('d-block');
      if (button.classList.contains('d-none')) {
        button.classList.remove('d-none');
      }
    } else {
      if (button.classList.contains('d-block')) {
        button.classList.remove('d-block');
      }
      button.classList.add('d-none');
    }
  });

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
