export function initBuilderPatterns() {
  const section = document.querySelector('.ai-agents-builder-patterns');
  if (!section) return;

  const features = section.querySelectorAll('.ai-agents-builder-patterns__feature');
  const blocks = section.querySelectorAll(
    '.ai-agents-builder-patterns__visual .ai-agents-builder-patterns__visual-block',
  );
  const featuresContainer = section.querySelector('.ai-agents-builder-patterns__features');
  const slider = section.querySelector('.ai-agents-builder-patterns__slider');
  if (!features.length) return;

  const breakpoints = { lg: 992 };

  let currentIndex = 0;
  let autoplayInterval = null;
  const AUTOPLAY_DELAY = 5000;

  const isLgUp = () => window.innerWidth >= breakpoints.lg;

  const goToFeature = (index) => {
    if (index < 0 || index >= features.length) return;

    features.forEach((feature) => {
      feature.classList.remove('ai-agents-builder-patterns__feature--active');
    });

    blocks.forEach((block) => {
      block.classList.remove('ai-agents-builder-patterns__visual-block--active');
    });

    features[index].classList.add('ai-agents-builder-patterns__feature--active');
    blocks[index]?.classList.add('ai-agents-builder-patterns__visual-block--active');

    currentIndex = index;
  };

  const nextFeature = () => {
    goToFeature((currentIndex + 1) % features.length);
  };

  const stopAutoplay = () => {
    if (!autoplayInterval) return;
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (!isLgUp()) return;
    autoplayInterval = setInterval(nextFeature, AUTOPLAY_DELAY);
  };

  const syncAutoplay = () => {
    if (isLgUp()) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
  };

  const applyFeaturesMinHeight = () => {
    if (!featuresContainer) return;

    const width = featuresContainer.offsetWidth;
    if (!width) return;

    const clone = featuresContainer.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('ai-agents-builder-patterns__features--measure');
    Object.assign(clone.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0',
      visibility: 'hidden',
      pointerEvents: 'none',
      width: `${width}px`,
      minHeight: '0',
    });

    section.appendChild(clone);

    const cloneFeatures = clone.querySelectorAll('.ai-agents-builder-patterns__feature');
    let maxHeight = 0;

    cloneFeatures.forEach((_, index) => {
      cloneFeatures.forEach((feature) => {
        feature.classList.remove('ai-agents-builder-patterns__feature--active');
      });
      cloneFeatures[index].classList.add('ai-agents-builder-patterns__feature--active');
      maxHeight = Math.max(maxHeight, clone.offsetHeight);
    });

    clone.remove();
    featuresContainer.style.minHeight = `${maxHeight}px`;
  };

  if (slider) {
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', syncAutoplay);
  }

  const isSliderHovered = () => slider?.matches(':hover');
  features.forEach((feature, index) => {
    feature.addEventListener('click', () => {
      goToFeature(index);
      if (!isSliderHovered()) {
        startAutoplay();
      }
    });
  });

  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      applyFeaturesMinHeight();
      syncAutoplay();
    });
  });

  goToFeature(0);
  applyFeaturesMinHeight();
  if (document.fonts?.ready) {
    document.fonts.ready.then(applyFeaturesMinHeight);
  }
  syncAutoplay();
}
