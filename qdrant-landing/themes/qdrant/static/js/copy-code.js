(function () {
  let codeBlocks = document.querySelectorAll('.highlight > pre');

  const codeClipboard = new ClipboardJS('.copy-code__btn');

  // adds copy buttons with specific id for each code block
  for (let block of codeBlocks) {
    const id = btoa(Math.random().toString()).substr(10, 5);
    block.id = id;

    let copyBtn = document.createElement('span')
    copyBtn.classList.add('d-inline-block', 'copy-code');
    copyBtn.id = 'copy-popover-' + id;
    copyBtn.dataset.toggle = 'popover'
    copyBtn.dataset.content = 'Text copied!'

    copyBtn.innerHTML = '<button class="copy-code__btn lead ml-2" data-clipboard-target="#' + id + '" title="Copy code">' +
      '<i class="flaticon-copy d-flex"></i>' +
      '</button>'
    block.after(copyBtn);

  }

  // set up clipboard
  codeClipboard.on('success', function (e) {
    const targetId = e.trigger.dataset.clipboardTarget.slice(1);

    $('#copy-popover-' + targetId).popover('show')
    const to = setTimeout(() => {
      $('#copy-popover-' + targetId).popover('hide')
      clearTimeout(to);
    }, 3000);
    e.clearSelection();
  });

  codeClipboard.on('error', function (e) {
    console.error('Action:', e.action);
    console.error('Trigger:', e.trigger);
  });
}).call(this);