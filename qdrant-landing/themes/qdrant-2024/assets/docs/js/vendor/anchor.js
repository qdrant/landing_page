import AnchorJS from 'anchor-js';

const TOAST_CLASS = 'anchor-copied-toast';
const TOAST_VISIBLE_CLASS = 'anchor-copied-toast--visible';
const TOAST_DURATION = 1800;

const anchors = new AnchorJS();
anchors.options.placement = 'left';
anchors.options.class = 'text-decoration-none';

let toast = null;
let toastTimeout = null;

// Kept empty until a copy happens, so the live region announces each one.
function createToast() {
  toast = document.createElement('div');
  toast.className = TOAST_CLASS;
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
}

function showToast() {
  if (!toast) return;

  clearTimeout(toastTimeout);
  toast.textContent = 'Copied';
  toast.classList.add(TOAST_VISIBLE_CLASS);

  toastTimeout = setTimeout(() => {
    toast.classList.remove(TOAST_VISIBLE_CLASS);
    toast.textContent = '';
  }, TOAST_DURATION);
}

document.addEventListener('DOMContentLoaded', function (event) {
  anchors.add('.qdrant-post__body :is(h1, h2, h3, h4, h5, h6)');
  if (/documentation|articles|course/.test(window.location?.pathname)) {
    anchors.add('.documentation-article > :is(h1, h2, h3, h4, h5, h6)');
  }
  createToast();
});

// Copy the heading URL on click, on top of the address bar update the link
// already does natively. Delegated, because anchors.add() injects the links
// after this script runs.
document.addEventListener('click', async function (event) {
  const link = event.target.closest('.anchorjs-link');

  if (!link) return;

  try {
    // link.href is already absolute, and matches what the address bar gets.
    await navigator.clipboard.writeText(link.href);
    showToast();
  } catch (e) {
    // Clipboard access needs a secure context; the link still works without it.
    console.error(e);
  }
});
