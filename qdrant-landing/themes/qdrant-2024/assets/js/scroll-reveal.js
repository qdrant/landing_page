/**
 * Lightweight scroll reveal using IntersectionObserver.
 * Respects prefers-reduced-motion.
 */

function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', initScrollReveal);
