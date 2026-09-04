import { trackAllClicksIn, trackScrollDepth, trackSectionViews } from './segment-helpers';

// ponytail: /cloud only, so Segment volume elsewhere is untouched.
// Move to index.js to take it sitewide.
trackAllClicksIn(document);
trackScrollDepth();
trackSectionViews();

// Dev-experience
(function initDevExperience() {
  const buttons = [...document.querySelectorAll('[data-dev-experience-tab]')];
  const panels = [...document.querySelectorAll('[data-dev-experience-panel]')];

  if (!buttons.length || !panels.length) return;

  const setActive = (index) => {
    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    panels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === index);
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.devExperienceTab);
      setActive(index);
    });
  });
})();
