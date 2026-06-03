import ClipboardJS from 'clipboard';
import Popover from 'bootstrap/js/src/popover.js';

(function () {
  let codeClipboard = null;
  const popoversMap = {};

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

  const initAutoInjectMode = (root = document) => {
    root.querySelectorAll('.highlight > pre').forEach((block) => {
      if (block.closest('.js-copy-code')) return;
      if (block.dataset.copyCodeInitialized) return;
      if (block.nextElementSibling?.classList.contains('copy-code')) return;

      block.dataset.copyCodeInitialized = 'true';

      const id = btoa(Math.random().toString()).substr(10, 5);
      block.id = id;

      const icon = document.createElement('i');
      icon.role = 'tooltip';
      icon.title = 'Copy to clipboard';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.role = 'button';
      copyBtn.classList.add('d-inline-block', 'copy-code', 'lead');
      copyBtn.id = 'copy-popover-' + id;
      copyBtn.dataset.clipboardTarget = '#' + id;
      copyBtn.appendChild(icon);
      block.after(copyBtn);

      popoversMap[id] = new Popover(copyBtn, {
        content: 'Text copied!',
        placement: 'left',
        trigger: 'manual',
        template:
          '<div class="popover" role="tooltip"><div class="popover-arrow"></div><div class="popover-body"></div></div>',
      });
    });

    if (!codeClipboard) {
      codeClipboard = new ClipboardJS('.copy-code');

      codeClipboard.on('success', (e) => {
        const targetId = e.trigger.dataset.clipboardTarget.slice(1);
        const popover = popoversMap[targetId];

        if (!popover) return;

        popover.show();

        setTimeout(() => {
          popover.hide();
        }, 2000);

        e.clearSelection();
      });

      codeClipboard.on('error', (e) => {
        console.error('Action:', e.action);
        console.error('Trigger:', e.trigger);
      });
    }
  };

  const initCopyCode = (root = document) => {
    initMarkupMode(root);
    initAutoInjectMode(root);
  };

  initCopyCode(document);
}).call(this);
