class TableOfContents {
  constructor(tocSelector, contentSelector) {
    this.tocLinks = Array.from(document.querySelectorAll(`${tocSelector} a`));
    this.headings = Array.from(
      document.querySelectorAll(
        `${contentSelector} h1, ${contentSelector} h2, ${contentSelector} h3, ${contentSelector} h4, ${contentSelector} h5, ${contentSelector} h6`,
      ),
    );
    this.currentActiveIndex = -1; // Track the current active heading index
    this.debounceTimeout = null;

    this.init();
  }

  // Initialize the Table of Contents functionality
  init() {
    this.setupObserver();
    this.initializeActiveLink();

    // Run initialization on resize
    window.addEventListener('resize', () => this.initializeActiveLink());
  }

  // Clear 'active' class from all links
  clearActiveClasses() {
    this.tocLinks.forEach((link) => link.classList.remove('active'));
  }

  // Set active link with debounce
  setActiveLink(index) {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      if (index !== this.currentActiveIndex) {
        this.clearActiveClasses();
        if (this.tocLinks[index]) {
          this.tocLinks[index].classList.add('active');
          this.currentActiveIndex = index;
        }
      }
    }, 50); // Small debounce for smoother highlighting
  }

  // Setup Intersection Observer
  setupObserver() {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const entryIndex = this.headings.indexOf(entry.target);

          // Determine scroll direction
          const isScrollingDown = entryIndex > this.currentActiveIndex;
          const step = isScrollingDown ? 1 : -1;

          // Step through active links
          for (let i = this.currentActiveIndex + step; i !== entryIndex + step; i += step) {
            this.setActiveLink(i);
          }

          // Ensure the intersecting entry's link is active
          this.setActiveLink(entryIndex);
        }
      });
    };

    // Observer options
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50% 0px',
      threshold: 0.25, // Lower threshold for better visibility
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    this.headings.forEach((heading) => observer.observe(heading));
  }

  // todo: should we rely on reaching the article's top or end instead of page's top or end?
  // Initialize active link based on current scroll position
  initializeActiveLink() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollBottom = scrollTop + window.innerHeight;
    const pageBottom = document.documentElement.scrollHeight - window.innerHeight;

    const offset = 0;

    if (scrollTop <= offset) {
      // At the very top (considering offset), highlight the first link
      this.setActiveLink(0);
    } else if (Math.abs(scrollBottom - pageBottom) <= offset) {
      // At the very bottom (considering offset), highlight the last link
      this.setActiveLink(this.tocLinks.length - 1);
    } else {
      // other code to handle mid-page logic
      const firstVisibleHeading = this.headings.find((heading) => heading.getBoundingClientRect().top >= offset);
      const firstVisibleIndex = this.headings.indexOf(firstVisibleHeading);
      this.setActiveLink(firstVisibleIndex);
    }
  }
}

export default TableOfContents;
