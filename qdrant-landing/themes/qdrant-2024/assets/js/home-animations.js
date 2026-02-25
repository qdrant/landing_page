/**
 * Hero parallax for home page.
 * Only runs when on home page (script loaded conditionally).
 */

function initHeroParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const layers = [
    { el: hero.querySelector('.hero__grid'), factor: 0.06, centered: false },
    { el: hero.querySelector('.hero__planet'), factor: 0.2, centered: true },
    { el: hero.querySelector('.hero__blue-haze'), factor: 0.08, centered: true },
    { el: hero.querySelector('.hero__astronauts'), factor: 0.12, centered: true },
  ].filter(({ el }) => el);

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    layers.forEach(({ el, factor, centered }) => {
      const y = scrollY * factor;
      el.style.transform = centered ? `translate(-50%, ${y}px)` : `translateY(${y}px)`;
    });
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateParallax();
}

document.addEventListener('DOMContentLoaded', initHeroParallax);
