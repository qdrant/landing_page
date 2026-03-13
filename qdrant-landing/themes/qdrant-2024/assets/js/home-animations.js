/**
 * Hero parallax for home page.
 * Only runs when on home page (script loaded conditionally).
 * Uses translate3d for Safari GPU acceleration and smooth rendering.
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
      const y = Math.round(scrollY * factor * 10) / 10;
      el.style.transform = centered ? `translate3d(-50%, ${y}px, 0)` : `translate3d(0, ${y}px, 0)`;
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
