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

  return new Promise((resolve) => {
    const scrollHandler = () => {
      // resolve promise when scroll is finished
      if (window.scrollY.toFixed() === targetPosition.toFixed()) {
        window.removeEventListener('scroll', scrollHandler);
        resolve();
      }
    };
    window.addEventListener('scroll', scrollHandler);
  });
}
