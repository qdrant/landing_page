(function () {
  const initTabs = (root) => {
    const tabsWrap = root.querySelector(".industries-hero__tabs");
    if (!tabsWrap) return;
    const [btnCode, btnSteps] = tabsWrap.querySelectorAll("button");
    const codeBlock = root.querySelector(".industries-hero__code");
    const stepsBlock = root.querySelector(".industries-hero__steps");
    if (!btnCode || !btnSteps || !codeBlock || !stepsBlock) return;

    const setActive = (view) => {
      const isCode = view === "code";
      codeBlock.hidden = !isCode;
      stepsBlock.hidden = isCode;
      btnCode.classList.toggle("active", isCode);
      btnSteps.classList.toggle("active", !isCode);
      btnCode.type = "button";
      btnSteps.type = "button";
      btnCode.setAttribute("aria-selected", String(isCode));
      btnSteps.setAttribute("aria-selected", String(!isCode));
    };

    btnCode.addEventListener("click", () => setActive("code"));
    btnSteps.addEventListener("click", () => setActive("steps"));
    setActive("code");
  };

  const initCodeExpandCollapse = (root) => {
    const code = root.querySelector(".industries-hero__code");
    if (!code) return;

    const content = code.querySelector(".industries-hero__code-content");
    const btnExpand = code.querySelector(".industries-hero__code-expand");
    const btnCollapse = code.querySelector(".industries-hero__code-collapse");
    if (!content || !btnExpand || !btnCollapse) return;

    const collapsedHeightPx = parseFloat(getComputedStyle(content).height);

    btnExpand.type = "button";
    btnCollapse.type = "button";

    const expand = () => {
      code.classList.add("is-expanded");

      const startHeight = content.getBoundingClientRect().height;
      content.style.height = `${startHeight}px`;
      content.offsetHeight;

      const targetHeight = content.scrollHeight;
      content.style.height = `${targetHeight}px`;

      const onEnd = (e) => {
        if (e.propertyName !== "height") return;
        content.style.height = "auto";
        content.removeEventListener("transitionend", onEnd);
      };
      content.addEventListener("transitionend", onEnd);
    };

    const collapse = () => {
      code.classList.remove("is-expanded");

      const startHeight = content.getBoundingClientRect().height;

      content.style.height = `${startHeight}px`;
      content.offsetHeight;
      content.style.height = `${collapsedHeightPx}px`;
    };

    btnExpand.addEventListener("click", expand);
    btnCollapse.addEventListener("click", collapse);
  };

  const initCopyCode = (root) => {
    const bindCopy = (codeWrap, { copyDisplay = "block", doneDisplay = "block" } = {}) => {
      const btnCopy = codeWrap.querySelector(".industries-architecture__code-copy, .industries-hero__code-copy");
      const btnDone = codeWrap.querySelector(".industries-architecture__code-done, .industries-hero__code-done");
      const codeEl = codeWrap.querySelector(".highlight code");

      if (!btnCopy || !btnDone || !codeEl) return;

      btnCopy.type = "button";
      btnDone.type = "button";

      btnCopy.addEventListener("click", async () => {
        const text = codeEl.textContent || "";

        try {
          await navigator.clipboard.writeText(text);
          btnCopy.style.display = "none";
          btnDone.style.display = doneDisplay;

          setTimeout(() => {
            btnDone.style.display = "none";
            btnCopy.style.display = copyDisplay;
          }, 1200);
        } catch (e) {
          console.error(e);
        }
      });
    };

    // industries-architecture
    root.querySelectorAll(".industries-architecture__code").forEach((codeWrap) => {
      bindCopy(codeWrap, { copyDisplay: "block", doneDisplay: "block" });
    });

    // industries-hero
    const codeWrap = root.querySelector(".industries-hero__code");
    if (!codeWrap) return;
    bindCopy(codeWrap, { copyDisplay: "flex", doneDisplay: "flex" });
  };

  const initCaseStudiesCarousel = () => {
    const root = document.querySelector('.industries-case-studies');
    const container = document.querySelector('.industries-case-studies__container');
    const carousel = document.querySelector('.industries-case-studies__carousel');
    const track = document.querySelector('.industries-case-studies__track');
    const prevBtn = document.querySelector('.industries-case-studies__arrow--prev');
    const nextBtn = document.querySelector('.industries-case-studies__arrow--next');

    if (!root || !container || !carousel || !track || !prevBtn || !nextBtn) return;

    const slides = track.querySelectorAll('.industries-case-studies__slide');
    const breakpoints = { sm: 576, md: 768, xl: 1200 };
    let currentOffset = 0;
    let gap = 0;
    let lastSlideWidth = 0;
    let lastGap = 0;
    let sliderEnabled = false;

    function readGap() {
      const style = getComputedStyle(track);
      gap = parseFloat(style.columnGap || style.gap) || 0;
      carousel.style.setProperty('--industries-case-studies-gap', gap + 'px');
    }

    function getVisibleCount() {
      const w = window.innerWidth;
      if (w < breakpoints.md) return 1;
      if (w < breakpoints.xl) return 2;
      return 3;
    }

    function getContainerContentWidth() {
      const style = getComputedStyle(container);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      return container.offsetWidth - paddingLeft - paddingRight;
    }

    function getSlideWidth() {
      const contentWidth = getContainerContentWidth();
      const count = Math.min(getVisibleCount(), slides.length);
      const gaps = Math.max(0, count - 1) * gap;
      return Math.floor((contentWidth - gaps) / count);
    }

    function applySlideWidth() {
      const slideWidth = getSlideWidth();
      carousel.style.setProperty('--industries-case-studies-slide-width', slideWidth + 'px');
    }

    function getMaxOffset() {
      applySlideWidth();
      const slideWidth = getSlideWidth();
      const trackWidth = slides.length * slideWidth + (slides.length - 1) * gap;
      const contentWidth = getContainerContentWidth();
      return Math.max(0, trackWidth - contentWidth);
    }

    function updateTrack() {
      if (!sliderEnabled) {
        currentOffset = 0;
        track.style.transform = 'translateX(0px)';
        return;
      }
      const maxOffset = getMaxOffset();
      currentOffset = Math.min(Math.max(0, currentOffset), maxOffset);
      track.style.transform = `translateX(-${currentOffset}px)`;
    }

    function updateButtons() {
      if (!sliderEnabled) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }
      const maxOffset = getMaxOffset();
      prevBtn.disabled = currentOffset <= 0;
      nextBtn.disabled = currentOffset >= maxOffset;
    }

    prevBtn.addEventListener('click', function() {
      if (!sliderEnabled) return;
      const slideWidth = getSlideWidth();
      currentOffset = Math.max(0, currentOffset - (slideWidth + gap));
      updateTrack();
      updateButtons();
    });

    nextBtn.addEventListener('click', function() {
      if (!sliderEnabled) return;
      const maxOffset = getMaxOffset();
      const slideWidth = getSlideWidth();
      currentOffset = Math.min(maxOffset, currentOffset + (slideWidth + gap));
      updateTrack();
      updateButtons();
    });

    function onResize() {
      const prevStep = (lastSlideWidth || getSlideWidth()) + (lastGap || gap || 0);
      const prevIndex = prevStep > 0 ? Math.round(currentOffset / prevStep) : 0;

      readGap();
      applySlideWidth();

      const visible = Math.min(getVisibleCount(), slides.length);
      const isSmall = window.innerWidth < breakpoints.md;
      sliderEnabled = !isSmall && slides.length > visible;
      root.classList.toggle('industries-case-studies__active-slider', sliderEnabled);

      if (!sliderEnabled) {
        currentOffset = 0;
      } else {
        const nextStep = getSlideWidth() + gap;
        currentOffset = prevIndex * nextStep;
      }

      updateTrack();
      updateButtons();

      lastGap = gap;
      lastSlideWidth = getSlideWidth();
    }

    let resizeRaf = 0;
    window.addEventListener('resize', function() {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(function() {
        resizeRaf = 0;
        onResize();
      });
    });

    onResize();
  }
  
  initTabs(document);
  initCodeExpandCollapse(document);
  initCopyCode(document);
  initCaseStudiesCarousel();
})();