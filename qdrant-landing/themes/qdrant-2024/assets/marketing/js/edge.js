(function () {
  const goTo = (items, activeClass, index) => {
    items.forEach((item, i) => {
      item.classList.toggle(activeClass, i === index);
    });
  };

  const initOnDeviceInference = () => {
    const section = document.querySelector('.edge-on-device-inference');
    if (!section) return;

    const items = [...section.querySelectorAll('.edge-on-device-inference__item')];
    const panels = [...section.querySelectorAll('.edge-on-device-inference__panel')];
    if (!items.length) return;

    const goToSlide = (index) => {
      if (index < 0 || index >= items.length) return;
      goTo(items, 'edge-on-device-inference__item--active', index);
      goTo(panels, 'edge-on-device-inference__panel--active', index);
    };

    items.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        goToSlide(i);
      });
    });
  };

  const initHardwareFit = () => {
    const section = document.querySelector('.edge-hardware-fit');
    if (!section) return;

    const tabs = [...section.querySelectorAll('[data-hardware-tab]')];
    const panels = [...section.querySelectorAll('[data-hardware-panel]')];
    if (!tabs.length) return;

    const goToTab = (index) => {
      if (index < 0 || index >= tabs.length) return;
      goTo(tabs, 'edge-hardware-fit__tab--active', index);
      goTo(panels, 'edge-hardware-fit__panel--active', index);
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => goToTab(i));
    });
  };

  initOnDeviceInference();
  initHardwareFit();
})();