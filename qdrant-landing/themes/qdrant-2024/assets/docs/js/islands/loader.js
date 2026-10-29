/*
 * Islands host loader (same-DOM model).
 *
 * Emitted once per page (only when an `island` shortcode is present) by
 * js.html. For each `.island` placeholder it:
 *   - lazily imports the island module when it nears the viewport,
 *   - injects the island's CSS once,
 *   - calls the module's mount(node, ctx) inside try/catch so one broken
 *     island can never affect its neighbors or the page,
 *   - drives the loading state on the wrapper: `is-ready` on success,
 *     `is-failed` on error/timeout. CSS uses these (plus the head `islands-js`
 *     class) to show a loader while loading, the island once ready, and the
 *     fallback image only when JS is off or the island failed.
 *   - relays host theme changes to islands via an 'island:themechange' event.
 *
 * Islands talk to the host with bubbling CustomEvents, no postMessage:
 *   island -> host : 'island:ready' | 'island:error'
 *   host   -> island: 'island:themechange' { detail: { theme } }
 */
(function () {
  'use strict';

  var LOAD_TIMEOUT = 15000; // if an island never becomes ready, fall back
  var cssHrefs = {}; // href -> true, so shared CSS is injected once
  var mounted = [];

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  function injectCss(href) {
    if (!href || cssHrefs[href]) return;
    cssHrefs[href] = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function settle(wrapper, cls) {
    if (wrapper.__islandSettled) return;
    wrapper.__islandSettled = true;
    wrapper.classList.add(cls); // 'is-ready' or 'is-failed'
    if (wrapper.__islandTimer) {
      window.clearTimeout(wrapper.__islandTimer);
      wrapper.__islandTimer = 0;
    }
  }

  function hydrate(wrapper) {
    if (wrapper.__islandHydrated) return;
    wrapper.__islandHydrated = true;

    injectCss(wrapper.getAttribute('data-island-css'));

    var mount = wrapper.querySelector('.island__mount') || wrapper;
    var src = wrapper.getAttribute('data-island-src');

    // Reveal the fallback if the island never becomes ready.
    wrapper.__islandTimer = window.setTimeout(function () {
      settle(wrapper, 'is-failed');
    }, LOAD_TIMEOUT);

    import(src)
      .then(function (mod) {
        if (!mod || typeof mod.mount !== 'function') {
          throw new Error('island module has no mount() export');
        }
        mod.mount(mount, { theme: currentTheme(), name: wrapper.getAttribute('data-island') });
        mounted.push(mount);
        // If the island rendered synchronously but forgot to dispatch ready,
        // don't strand it on the spinner — the timer will still fall back.
      })
      .catch(function (err) {
        settle(wrapper, 'is-failed');
        if (window.console) console.error('[island] failed to load', wrapper.getAttribute('data-island'), err);
      });
  }

  function onIslandEvent(event) {
    var wrapper = event.target.closest ? event.target.closest('.island') : null;
    if (!wrapper) return;
    if (event.type === 'island:ready') settle(wrapper, 'is-ready');
    else if (event.type === 'island:error') settle(wrapper, 'is-failed');
  }

  function broadcastTheme() {
    var theme = currentTheme();
    for (var i = 0; i < mounted.length; i++) {
      try {
        mounted[i].dispatchEvent(new CustomEvent('island:themechange', { detail: { theme: theme } }));
      } catch (_) {}
    }
  }

  function init() {
    var wrappers = document.querySelectorAll('.island');
    if (!wrappers.length) return;

    // Island lifecycle events bubble up to the document.
    document.addEventListener('island:ready', onIslandEvent);
    document.addEventListener('island:error', onIslandEvent);

    // Relay host theme toggles into mounted islands (for canvas repaints).
    var themeObserver = new MutationObserver(broadcastTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              obs.unobserve(entry.target);
              hydrate(entry.target);
            }
          });
        },
        { rootMargin: '200px 0px' },
      );
      for (var i = 0; i < wrappers.length; i++) io.observe(wrappers[i]);
    } else {
      for (var j = 0; j < wrappers.length; j++) hydrate(wrappers[j]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
