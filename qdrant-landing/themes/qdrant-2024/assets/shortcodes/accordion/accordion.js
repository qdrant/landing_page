// Expands and collapses the items of the accordion shortcode.
document.addEventListener('DOMContentLoaded', () => {
  function toggleAccordion() {
    this.parentElement.classList.toggle('active');
    const panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }

  document.querySelectorAll('.accordion-dark__item-header').forEach((el) => {
    el.addEventListener('click', toggleAccordion);
  });
});
