import Popover from 'bootstrap/js/src/popover.js';

(function () {
  const initMarkupMode = (root = document) => {
    root.querySelectorAll('.js-copy-code').forEach((wrap) => {
      if (wrap.dataset.copyCodeInitialized) return;

      const btnCopy = wrap.querySelector('.js-copy-code__copy');
      const btnDone = wrap.querySelector('.js-copy-code__done');
      const codeEl = wrap.querySelector('.highlight code');

      if (!btnCopy || !btnDone || !codeEl) return;

      wrap.dataset.copyCodeInitialized = 'true';

      btnCopy.type = 'button';
      btnDone.type = 'button';

      const copyDisplay =
        getComputedStyle(btnCopy).display === 'none'
          ? 'inline-flex'
          : getComputedStyle(btnCopy).display;
      const doneDisplay =
        getComputedStyle(btnDone).display === 'none'
          ? copyDisplay
          : getComputedStyle(btnDone).display;

      btnDone.style.display = 'none';

      btnCopy.addEventListener('click', async () => {
        const text = codeEl.textContent || '';

        try {
          await navigator.clipboard.writeText(text);

          btnCopy.style.display = 'none';
          btnDone.style.display = doneDisplay;

          setTimeout(() => {
            btnDone.style.display = 'none';
            btnCopy.style.display = copyDisplay;
          }, 1200);
        } catch (e) {
          console.error(e);
        }
      });
    });
  };

  // Language tabs hide inactive snippets with display: none. Popper places a
  // popover whose button has no box at the page origin, on any update until
  // the popover is gone, including during its fade-out. This modifier runs in
  // that same update and makes the popover invisible, so the wrong position is
  // never painted.
  const hideWithHiddenButton = {
    name: 'hideWithHiddenButton',
    enabled: true,
    phase: 'beforeWrite',
    requires: ['computeStyles'],
    fn: ({ state }) => {
      const hidden = state.elements.reference.getClientRects().length === 0;
      state.styles.popper.visibility = hidden ? 'hidden' : '';
    },
  };

  // Then removes the popover once its button is no longer visible, so it does
  // not come back when the tab is switched back.
  const popoverHiders = new WeakMap();
  const buttonVisibility = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) popoverHiders.get(entry.target)?.();
    });
  });

  const initAutoInjectMode = (root = document) => {
    root.querySelectorAll('.highlight > pre').forEach((block) => {
      if (block.closest('.js-copy-code')) return;
      if (block.closest('.without-copy-code')) return;
      if (block.dataset.copyCodeInitialized) return;
      if (block.nextElementSibling?.classList.contains('copy-code')) return;

      block.dataset.copyCodeInitialized = 'true';

      const icon = document.createElement('i');
      icon.role = 'tooltip';
      icon.title = 'Copy to clipboard';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.role = 'button';
      copyBtn.classList.add('d-inline-block', 'copy-code', 'lead');
      copyBtn.appendChild(icon);
      block.after(copyBtn);

      const popover = new Popover(copyBtn, {
        content: 'Text copied!',
        placement: 'left',
        trigger: 'manual',
        template:
          '<div class="popover" role="tooltip"><div class="popover-arrow"></div><div class="popover-body"></div></div>',
        popperConfig: (config) => ({ ...config, modifiers: [...config.modifiers, hideWithHiddenButton] }),
      });

      let hideTimer = null;
      const hidePopover = () => {
        clearTimeout(hideTimer);
        buttonVisibility.unobserve(copyBtn);
        popover.hide();
      };
      popoverHiders.set(copyBtn, hidePopover);

      copyBtn.addEventListener('click', async () => {
        // textContent, not innerText: Chroma puts each line in its own element,
        // and innerText adds a blank line between them in Chrome and Firefox.
        // Chroma also ends every block with a newline, which is not code.
        const text = block.textContent.replace(/\n$/, '');

        try {
          await navigator.clipboard.writeText(text);

          popover.show();
          buttonVisibility.observe(copyBtn);

          // One timer per button, so a second click restarts the countdown
          // rather than an earlier timer hiding the popover early.
          clearTimeout(hideTimer);
          hideTimer = setTimeout(hidePopover, 2000);
        } catch (e) {
          console.error(e);
        }
      });
    });
  };
  
  const initCopyCode = (root = document) => {
    initMarkupMode(root);
    initAutoInjectMode(root);
  };
  
  initCopyCode(document);
}).call(this);