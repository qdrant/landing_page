// Shared plumbing for the docs filter widgets (example library, guide directory, integration directory).
// Shows the form, mirrors its controls in the URL, filters as they change, and handles reset and history.
// `filter` only updates the page. This helper owns the URL. catalog-filters.js (customers, demos) is a
// separate, larger system with sorting, batched loading, multi-value keys, and a mobile apply step.
//
// Options:
//   paramPrefix  prepended to each control's name in the URL, so two widgets on one page don't share params
//   onReset      called after Clear. By default focus moves to the first control
const URL_WRITE_DELAY = 200;

export function bindFilterForm(form, controls, filter, { paramPrefix = '', onReset } = {}) {
  const param = control => paramPrefix + control.name;
  let pendingWrite;

  const readURL = () => {
    const params = new URLSearchParams(window.location.search);
    controls.forEach(control => {
      const value = params.get(param(control)) || '';
      const valid = control.tagName !== 'SELECT' || [...control.options].some(option => option.value === value);
      control.value = valid ? value : '';
    });
  };

  const writeURL = () => {
    clearTimeout(pendingWrite);
    const url = new URL(window.location.href);
    controls.forEach(control => {
      const value = control.value.trim();
      if (value) url.searchParams.set(param(control), value);
      else url.searchParams.delete(param(control));
    });
    if (url.href !== window.location.href) window.history.replaceState(null, '', url);
  };

  // Typing writes the URL once it pauses, which also keeps Safari under its replaceState rate limit.
  const apply = ({ debounce = false } = {}) => {
    filter();
    clearTimeout(pendingWrite);
    if (debounce) pendingWrite = setTimeout(writeURL, URL_WRITE_DELAY);
    else writeURL();
  };

  form.hidden = false;
  readURL();
  // Writing on load drops values readURL rejected, such as a removed select option from an old link.
  apply();

  form.addEventListener('submit', event => {
    event.preventDefault();
    apply();
  });
  // Text fields filter as you type. Selects filter once, on change.
  form.addEventListener('input', event => {
    if (event.target.tagName !== 'SELECT') apply({ debounce: true });
  });
  form.addEventListener('change', event => {
    if (event.target.tagName === 'SELECT') apply();
  });
  form.addEventListener('reset', event => {
    event.preventDefault();
    controls.forEach(control => { control.value = ''; });
    apply();
    if (onReset) onReset();
    else controls[0]?.focus();
  });
  window.addEventListener('popstate', () => {
    clearTimeout(pendingWrite);
    readURL();
    filter();
  });
}
