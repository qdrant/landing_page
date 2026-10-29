import Popover from 'bootstrap/js/src/popover.js';

// "Copy as Markdown" button, see partials/copy-markdown-button.html.
//
// The Markdown is fetched from data-copy-markdown-src and copied exactly as
// published, agent pointers included. The fetch starts when the pointer or
// focus reaches the button, so by the click it has usually finished and the
// loading state never shows.

// Show the spinner only if the copy takes noticeably long, so a prefetched
// copy does not flicker.
const LOADING_DELAY_MS = 150;
const CONFIRM_MS = 2000;

const cache = new Map();

const fetchMarkdown = (src) => {
  if (!cache.has(src)) {
    const request = fetch(src, { headers: { Accept: 'text/markdown, text/plain' } }).then((response) => {
      if (!response.ok) throw new Error(`${src}: HTTP ${response.status}`);
      return response.text();
    });
    // Let a failed request be retried on the next click.
    request.catch(() => cache.delete(src));
    cache.set(src, request);
  }
  return cache.get(src);
};

// What the browser requires for this to work:
// - A secure context. navigator.clipboard does not exist on plain HTTP, which in
//   practice only means a dev server opened by LAN IP; qdrant.tech, deploy
//   previews and localhost are all secure.
// - A user activation. Chrome and Firefox keep one alive for a few seconds after
//   the click, long enough for the fetch. Safari requires the write itself to
//   start inside the click, which an awaited fetch would miss, so the write is
//   started at once with a ClipboardItem holding the pending text.
// - No Permissions-Policy blocking clipboard-write. The site sets none, and the
//   policy only matters for pages embedded in iframes.
// Writing needs no permission prompt in any of them; only reading does.
const writeToClipboard = async (textPromise) => {
  if (!navigator.clipboard) throw new Error('Clipboard API needs a secure context (HTTPS or localhost)');

  if (window.ClipboardItem && navigator.clipboard.write) {
    const blob = textPromise.then((text) => new Blob([text], { type: 'text/plain' }));
    // Handled below through textPromise; silences the duplicate rejection.
    blob.catch(() => {});
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
      return;
    } catch {
      // Retried with writeText, for browsers that reject a promise inside a
      // ClipboardItem.
    }
  }
  // Rethrows a failed fetch, which writeText could not fix.
  const text = await textPromise;
  await navigator.clipboard.writeText(text);
};

const initButton = (button) => {
  if (button.dataset.copyMarkdownInitialized) return;
  button.dataset.copyMarkdownInitialized = 'true';

  // canonifyURLs makes the source absolute to the production host. Fetch the
  // same path from wherever the page is served, so previews copy their own
  // Markdown and the request is never cross-origin.
  const src = new URL(button.dataset.copyMarkdownSrc, location.href).pathname;
  // The popover is not announced by screen readers, so the outcome also goes
  // to a live region.
  const status = button.querySelector('.copy-markdown__status');

  const popover = new Popover(button, {
    content: 'Copied to clipboard!',
    placement: 'bottom',
    trigger: 'manual',
    template:
      '<div class="popover" role="tooltip"><div class="popover-arrow"></div><div class="popover-body"></div></div>',
  });

  let resetTimer = null;

  const setState = (state) => {
    button.dataset.state = state;
    button.setAttribute('aria-busy', String(state === 'loading'));
  };

  const confirm = (message, state) => {
    popover.setContent({ '.popover-body': message });
    popover.show();
    setState(state);
    if (status) status.textContent = message;

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      popover.hide();
      setState('idle');
      if (status) status.textContent = '';
    }, CONFIRM_MS);
  };

  const prefetch = () => fetchMarkdown(src).catch(() => {});
  button.addEventListener('pointerenter', prefetch, { once: true });
  button.addEventListener('focus', prefetch, { once: true });

  button.addEventListener('click', async () => {
    if (button.dataset.state === 'loading') return;

    clearTimeout(resetTimer);
    popover.hide();
    const loadingTimer = setTimeout(() => setState('loading'), LOADING_DELAY_MS);

    try {
      await writeToClipboard(fetchMarkdown(src));
      clearTimeout(loadingTimer);
      confirm('Copied to clipboard!', 'done');
    } catch (e) {
      clearTimeout(loadingTimer);
      console.error('Copy as Markdown failed:', e);
      confirm('Could not copy. Please try again.', 'idle');
    }
  });
};

document.querySelectorAll('.js-copy-markdown').forEach(initButton);
