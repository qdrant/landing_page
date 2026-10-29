import { DOCS_HEADER_OFFSET } from './constants';

class TableOfContents {
  constructor(tocSelector, contentSelector) {
    this.tocLinks = Array.from(document.querySelectorAll(`${tocSelector} a`));
    this.headings = Array.from(
      document.querySelectorAll(`${contentSelector} h1[id], ${contentSelector} h2[id], ${contentSelector} h3[id]`),
    );
    this.currentActiveIndex = -1; // Track the current active heading index
    this.currentActive = null; // Track the current active heading element

    this.debounceTimeout = null;

    this.currentlyVisibleHeaderIds = new Set();

    this.headerOffset = DOCS_HEADER_OFFSET + 10;

    this.init();
  }

  // Initialize the Table of Contents functionality
  init() {
    this.setupObserver();
  }

  // Clear 'active' class from all links
  clearActiveClasses() {
    this.tocLinks.forEach((link) => link.classList.remove('active'));
  }

  // Set active link with debounce
  setActiveLink(index) {
    if (index !== this.currentActiveIndex) {
      this.clearActiveClasses();
      if (this.tocLinks[index]) {
        this.tocLinks[index].classList.add('active');
        this.currentActiveIndex = index;
        this.currentActive = this.headings[index];
      }
    }
  }

  // Setup Intersection Observer
  setupObserver() {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const entryIndex = this.headings.indexOf(entry.target);
        const isIntersecting = entry.isIntersecting;

        if (isIntersecting) {
          this.currentlyVisibleHeaderIds.add(entryIndex);
        } else {
          this.currentlyVisibleHeaderIds.delete(entryIndex);
        }
      });

      if (this.currentlyVisibleHeaderIds.size !== 0) {
        let minimalVisibleHeaderId = Math.min(...Array.from(this.currentlyVisibleHeaderIds));
        this.setActiveLink(minimalVisibleHeaderId);
      } else {
        // No intersection found
        // If current active heading is below the viewport, then set current active to one above it
        if (this.currentActive && this.currentActive.getBoundingClientRect().top > this.headerOffset) {
          this.setActiveLink(this.currentActiveIndex - 1);
        }
      }
    };

    // Observer options
    const observerOptions = {
      root: null,
      rootMargin: `-${this.headerOffset}px 0px -25% 0px`,
      threshold: 0.0, // Lower threshold for better visibility
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    this.headings.forEach((heading) => observer.observe(heading));
  }
}

export default TableOfContents;
