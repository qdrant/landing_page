// /stars/ page: "Load More" for the star cards and the arrow controls of the perks carousel.
// Without this script every card is visible and the perks track scrolls natively.

function initLoadMore(section) {
  const button = section.querySelector('[data-stars-load-more]');
  const cards = [...section.querySelectorAll('[data-stars-card]')];
  const pageSize = Number(section.dataset.pageSize) || 8;

  if (!button || cards.length <= pageSize) {
    return;
  }

  let shown = pageSize;
  cards.slice(shown).forEach((card) => (card.hidden = true));
  button.hidden = false;

  button.addEventListener('click', () => {
    const next = cards.slice(shown, shown + pageSize);
    next.forEach((card) => (card.hidden = false));
    shown += next.length;

    // Keep keyboard users where they were: move focus to the first card just revealed.
    next[0]?.setAttribute('tabindex', '-1');
    next[0]?.focus({ preventScroll: true });

    if (shown >= cards.length) {
      button.hidden = true;
    }
  });
}

function initPerksCarousel(section) {
  const track = section.querySelector('[data-stars-perks-track]');
  const prev = section.querySelector('[data-stars-perks-prev]');
  const next = section.querySelector('[data-stars-perks-next]');

  if (!track || !prev || !next) {
    return;
  }

  const step = () => {
    const card = track.firstElementChild;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  };

  // Snap points sit at card starts, so the last one can stop a few pixels short of the
  // maximum scroll. Treat anything within a small tolerance as the end.
  const tolerance = 12;
  const update = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= tolerance;
    next.disabled = track.scrollLeft >= maxScroll - tolerance;
  };

  prev.addEventListener('click', () => track.scrollBy({ left: -step() }));
  next.addEventListener('click', () => track.scrollBy({ left: step() }));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

document.querySelectorAll('[data-stars-list]').forEach(initLoadMore);
document.querySelectorAll('[data-stars-perks]').forEach(initPerksCarousel);
