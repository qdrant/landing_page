/*
 * viz.js — progressive enhancement for build-time chart SVGs.
 *
 * The SVG is generated at build time and is complete without this file: every
 * number is already in the markup, so scrapers, feed readers and no-JS visitors
 * lose nothing. This only adds hover affordances on top.
 *
 * Interaction model borrowed from the reference charts we benchmarked against:
 *   - full-height invisible hit zones, so you hover the COLUMN, not the bar
 *   - one shared cursor-following tooltip, positioned imperatively
 *   - "highlight, don't reorder": nothing dims, nothing moves. The hovered
 *     series just gains an outline. Dimming the rest makes a chart feel like it
 *     is hiding data from you.
 *   - the same key highlights across every panel, so a config you hover in the
 *     throughput chart also lights up in the latency chart
 */
(function () {
  var figures = document.querySelectorAll('[data-viz]');
  if (!figures.length) return;

  var tip = document.createElement('div');
  tip.className = 'viz-tip';
  tip.setAttribute('role', 'status');
  tip.setAttribute('aria-live', 'polite');
  document.body.appendChild(tip);

  function move(e) {
    var pad = 14;
    var w = tip.offsetWidth;
    var h = tip.offsetHeight;
    var x = e.clientX + pad;
    var y = e.clientY + pad;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - pad;
    if (y + h > window.innerHeight - 8) y = e.clientY - h - pad;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  }

  function show(e, title, rows) {
    var html = '<div class="viz-tip__title">' + title + '</div>';
    for (var i = 0; i < rows.length; i++) {
      html += '<div class="viz-tip__row">'
        + (rows[i].c ? '<span class="viz-tip__dot" style="background:' + rows[i].c + '"></span>' : '')
        + '<span class="viz-tip__k">' + rows[i].k + '</span>'
        + '<b class="viz-tip__v">' + rows[i].v + '</b></div>';
    }
    tip.innerHTML = html;
    tip.classList.add('is-on');
    move(e);
  }

  function hide() { tip.classList.remove('is-on'); }

  Array.prototype.forEach.call(figures, function (fig) {
    var zones = fig.querySelectorAll('[data-viz-zone]');

    // Line charts carry a dashed vertical rule that snaps to the hovered
    // x-column, so the eye can read every series at the same x.
    function setCrosshair(zone) {
      var lines = fig.querySelectorAll('[data-viz-crosshair]');
      for (var i = 0; i < lines.length; i++) lines[i].setAttribute('opacity', '0');
      if (!zone) return;
      var x = zone.getAttribute('data-viz-x');
      var panel = zone.getAttribute('data-viz-panel');
      if (x === null || panel === null) return;
      var line = fig.querySelector('[data-viz-crosshair="' + panel + '"]');
      if (!line) return;
      line.setAttribute('x1', x);
      line.setAttribute('x2', x);
      line.setAttribute('opacity', '1');
    }

    function setActive(key) {
      // Zones carry a key too, but they are invisible hit targets — ringing
      // them would draw a tall box around the whole column.
      var marks = fig.querySelectorAll('[data-viz-key]:not([data-viz-zone])');
      Array.prototype.forEach.call(marks, function (m) {
        // Highlight across every panel in this figure, not just the hovered one.
        if (key !== null && m.getAttribute('data-viz-key') === key) {
          m.setAttribute('data-viz-active', '');
        } else {
          m.removeAttribute('data-viz-active');
        }
      });
    }

    Array.prototype.forEach.call(zones, function (z) {
      var key = z.getAttribute('data-viz-key');
      var title = z.getAttribute('data-viz-title') || '';
      var rows;
      try { rows = JSON.parse(z.getAttribute('data-viz-rows') || '[]'); } catch (err) { rows = []; }

      function enter(e) { setActive(key); setCrosshair(z); show(e, title, rows); }
      z.addEventListener('pointerenter', enter);
      z.addEventListener('pointermove', move);
      z.addEventListener('pointerleave', function () { setActive(null); setCrosshair(null); hide(); });
      // Keyboard parity: the zones are focusable, so tabbing reads the same rows.
      z.addEventListener('focus', function () {
        setActive(key);
        setCrosshair(z);
        var r = z.getBoundingClientRect();
        show({ clientX: r.left + r.width / 2, clientY: r.top }, title, rows);
      });
      z.addEventListener('blur', function () { setActive(null); setCrosshair(null); hide(); });
    });

    fig.addEventListener('pointerleave', function () { setActive(null); setCrosshair(null); hide(); });
  });
})();
