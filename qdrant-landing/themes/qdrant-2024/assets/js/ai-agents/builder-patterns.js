export function initBuilderPatterns() {
  const section = document.querySelector('.ai-agents-builder-patterns');
  if (!section) return;

  const features = section.querySelectorAll('.ai-agents-builder-patterns__feature');
  const blocks = section.querySelectorAll(
    '.ai-agents-builder-patterns__visual .ai-agents-builder-patterns__visual-block',
  );
  const featuresContainer = section.querySelector('.ai-agents-builder-patterns__features');
  const visualContainer = section.querySelector('.ai-agents-builder-patterns__visual');
  const content = section.querySelector('.ai-agents-builder-patterns__content');
  const slider = section.querySelector('.ai-agents-builder-patterns__slider');
  if (!features.length) return;

  const breakpoints = { lg: 992 };

  let currentIndex = 0;
  let autoplayInterval = null;
  let isInView = true;
  let heightsInitialized = false;
  let lastMeasuredWidth = 0;
  let wasLgUp = window.innerWidth >= breakpoints.lg;
  const AUTOPLAY_DELAY = 5000;
  // Ignore sub-pixel scrollbar gutter oscillation (overlay scrollbars on macOS).
  const WIDTH_CHANGE_THRESHOLD = 24;

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
    if (!isLgUp() || !isInView || slider?.matches(':hover')) return;
    autoplayInterval = setInterval(nextFeature, AUTOPLAY_DELAY);
  };

  const syncAutoplay = () => {
    if (!isLgUp() || !isInView) {
      stopAutoplay();
      return;
    }
    startAutoplay();
  };

  const setMinHeight = (element, height) => {
    if (!element || !height) return;
    const next = `${height}px`;
    if (element.style.minHeight === next) return;
    element.style.minHeight = next;
  };

  const measureOffscreenClone = (element, measure) => {
    const width = element.offsetWidth;
    if (!width) return 0;

    const clone = element.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
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
    const maxHeight = measure(clone);
    clone.remove();

    return maxHeight;
  };

  const applyFeaturesMinHeight = () => {
    if (!featuresContainer) return;

    const maxHeight = measureOffscreenClone(featuresContainer, (clone) => {
      const cloneFeatures = clone.querySelectorAll('.ai-agents-builder-patterns__feature');
      let height = 0;

      cloneFeatures.forEach((_, index) => {
        cloneFeatures.forEach((feature) => {
          feature.classList.remove('ai-agents-builder-patterns__feature--active');
        });
        cloneFeatures[index].classList.add('ai-agents-builder-patterns__feature--active');
        height = Math.max(height, clone.offsetHeight);
      });

      return height;
    });

    setMinHeight(featuresContainer, maxHeight);
  };

  const applyVisualMinHeight = () => {
    if (!visualContainer) return;

    if (!isLgUp()) {
      visualContainer.style.removeProperty('min-height');
      return;
    }

    const maxHeight = measureOffscreenClone(visualContainer, (clone) => {
      const cloneBlocks = clone.querySelectorAll('.ai-agents-builder-patterns__visual-block');
      let height = 0;

      cloneBlocks.forEach((block) => {
        block.style.display = 'block';
        height = Math.max(height, block.offsetHeight);
      });

      return height;
    });

    setMinHeight(visualContainer, maxHeight);
  };

  const applyLayoutHeights = () => {
    applyFeaturesMinHeight();
    applyVisualMinHeight();
  };

  const initLayoutHeights = () => {
    applyLayoutHeights();
    heightsInitialized = true;
    if (content) {
      lastMeasuredWidth = Math.round(content.getBoundingClientRect().width);
    }
  };

  if (slider) {
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', syncAutoplay);
  }

  features.forEach((feature, index) => {
    feature.addEventListener('click', () => {
      goToFeature(index);
      syncAutoplay();
    });
  });

  if (content && typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver((entries) => {
      if (!heightsInitialized) return;

      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      if (!width || Math.abs(width - lastMeasuredWidth) < WIDTH_CHANGE_THRESHOLD) return;

      lastMeasuredWidth = width;
      applyLayoutHeights();
    });

    resizeObserver.observe(content);
  }

  window.addEventListener('resize', () => {
    const lgUp = isLgUp();
    if (lgUp !== wasLgUp) {
      wasLgUp = lgUp;
      applyLayoutHeights();
      if (content) {
        lastMeasuredWidth = Math.round(content.getBoundingClientRect().width);
      }
      syncAutoplay();
    }
  });

  if (typeof IntersectionObserver !== 'undefined') {
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        isInView = entries[0]?.isIntersecting ?? false;
        syncAutoplay();
      },
      { threshold: 0 },
    );

    visibilityObserver.observe(section);
  }

  goToFeature(0);

  // Measure once after webfonts load. An earlier measure + later remeasure shifts
  // min-heights while the section is on screen; scroll anchoring and
  // `scroll-behavior: smooth` on <html> then correct scroll position once.
  if (document.fonts?.status === 'loaded') {
    initLayoutHeights();
  } else if (document.fonts?.ready) {
    document.fonts.ready.then(initLayoutHeights);
  } else {
    initLayoutHeights();
  }

  syncAutoplay();
}
