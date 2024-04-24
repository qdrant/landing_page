import ClipboardJS from 'clipboard';
import Popover from 'bootstrap/js/src/popover.js';
import Tooltip from 'bootstrap/js/src/tooltip.js';

(function () {
  let codeBlocks = document.querySelectorAll('.highlight > pre');

  const codeClipboard = new ClipboardJS('.copy-code');
  const popoversMap = {};

  // adds copy buttons with specific id for each code block
  for (let block of codeBlocks) {
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
  }

  codeClipboard.on('success', function (e) {
    const targetId = e.trigger.dataset.clipboardTarget.slice(1);

    const popover = popoversMap[targetId];
    popover.show();

    const t = setTimeout(() => {
      popover.hide();
      clearTimeout(t);
    }, 2000);
    e.clearSelection();
  });

  codeClipboard.on('error', function (e) {
    console.error('Action:', e.action);
    console.error('Trigger:', e.trigger);
  });
}).call(this);
