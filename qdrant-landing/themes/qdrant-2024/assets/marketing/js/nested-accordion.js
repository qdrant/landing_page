(function () {
  const buttons = [...document.querySelectorAll('[data-faq-category]')];
  const panels = [...document.querySelectorAll('[data-faq-panel]')];

  if (!buttons.length || !panels.length) return;

  const setActiveCategory = (index) => {
    buttons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === index);
    });

    panels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === index);
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.faqCategory);
      setActiveCategory(index);
    });
  });
})();