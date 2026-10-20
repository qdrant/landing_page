// Shared wiring for the docs filter forms (guides, examples, integration directories):
// shows the form, mirrors its controls in the URL, filters as controls change, and handles reset and history.
// `filter` re-renders the results from the current control values.

// Each widget script bundles its own copy of this module, so the URL parameters
// already in use on the page are tracked on `window`, shared by all of them.
const claimedParams = (window.qdrantFilterFormParams ??= new Set());

export function bindFilterForm(form, controls, filter, { onReset } = {}) {
  // The first form to use a parameter name owns it in the URL. A later form
  // with a clashing name still filters, but leaves the URL alone, so two
  // widgets never read each other's search terms on reload.
  const names = controls.map(control => control.name);
  const syncURL = !names.some(name => claimedParams.has(name));
  if (syncURL) names.forEach(name => claimedParams.add(name));

  function readURL() {
    const params = new URLSearchParams(window.location.search);
    for (const control of controls) {
      const value = params.get(control.name) || '';
      const valid = control.tagName !== 'SELECT' || [...control.options].some(option => option.value === value);
      control.value = valid ? value : '';
    }
  }

  function update(updateURL = true) {
    filter();
    if (!updateURL || !syncURL) return;
    const url = new URL(window.location.href);
    for (const control of controls) {
      const value = control.value.trim();
      if (value) url.searchParams.set(control.name, value);
      else url.searchParams.delete(control.name);
    }
    window.history.replaceState(null, '', url);
  }

  form.hidden = false;
  if (syncURL) readURL();
  update(false);
  form.addEventListener('submit', event => { event.preventDefault(); update(); });
  // Text fields filter as the user types. Selects filter on `change`, which every
  // browser fires for them, and skip `input` so one selection filters only once.
  form.addEventListener('input', event => { if (event.target.tagName !== 'SELECT') update(); });
  form.addEventListener('change', event => { if (event.target.tagName === 'SELECT') update(); });
  form.addEventListener('reset', event => {
    event.preventDefault();
    controls.forEach(control => { control.value = ''; });
    update();
    onReset?.();
  });
  if (syncURL) window.addEventListener('popstate', () => { readURL(); update(false); });
}
