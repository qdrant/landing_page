// Nearest neighbors explorer on /customers/.
//
// Points live in panel units (width x height, 1000 x 760). On a portrait
// panel the map is drawn transposed, which preserves distances, with logo
// positions de-overlapped again for that orientation (px, py).
// A chip or a logo shows its precomputed top k, ranked by cosine similarity
// in the full embedding space. A point clicked on empty space ranks by
// distance on the map.

const SVG_NS = 'http://www.w3.org/2000/svg';
const KEY_STEP = 40;

function initNeighbors(root) {
  const space = JSON.parse(root.querySelector('[data-space]').textContent);
  // Plain reads rather than destructuring: Hugo's minify step reorders a
  // destructuring declaration ahead of the JSON.parse it depends on.
  const W = space.width;
  const H = space.height;
  const limit = space.limit;
  const panel = root.querySelector('[data-panel]');
  const lines = root.querySelector('[data-lines]');
  const dot = root.querySelector('[data-dot]');
  const ring = root.querySelector('[data-ring]');
  const hitsList = root.querySelector('[data-hits]');
  const scoreLabel = root.querySelector('[data-score-label]');
  const chips = [...root.querySelectorAll('[data-query]')];

  const points = space.points.map((p) => ({
    ...p,
    u: p.x * W,
    v: p.y * H,
    el: panel.querySelector(`[data-point="${p.id}"]`),
  }));
  const byId = Object.fromEntries(points.map((p) => [p.id, p]));
  const logoMarkup = Object.fromEntries(
    points.map((p) => [p.id, p.el.querySelector('.customers-neighbors__logo').outerHTML]),
  );

  let query = null;

  const isPortrait = () => panel.clientHeight > panel.clientWidth;

  // Panel units to a percentage position inside the panel.
  function place(u, v) {
    return isPortrait() ? { left: (v / H) * 100, top: (u / W) * 100 } : { left: (u / W) * 100, top: (v / H) * 100 };
  }

  // Where a case study's logo is drawn, as a percentage position.
  function placePoint(p) {
    return isPortrait() ? { left: p.px * 100, top: p.py * 100 } : { left: p.x * 100, top: p.y * 100 };
  }

    function rankByDistance(u, v) {
    return points
      .map((p) => ({ point: p, d: Math.hypot(p.u - u, p.v - v) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limit)
      .map(({ point, d }) => ({ point, score: Math.max(0, 1 - d / W) }));
  }

  function renderHits(hits, label) {
    scoreLabel.textContent = label;
    hitsList.innerHTML = '';
    for (const { point, score } of hits) {
      const li = document.createElement('li');
      li.className = 'customers-neighbors__hit';
      const a = document.createElement('a');
      a.className = 'customers-neighbors__hit-link';
      a.href = point.url;
      const slot = document.createElement('span');
      slot.className = 'customers-neighbors__hit-logo-slot';
      slot.innerHTML = logoMarkup[point.id].replace('customers-neighbors__point-logo', 'customers-neighbors__hit-logo');
      a.append(slot);
      const cta = document.createElement('span');
      cta.className = 'customers-neighbors__hit-cta';
      cta.innerHTML = 'Read the story <span aria-hidden="true">&rarr;</span>';
      a.append(cta);
      const s = document.createElement('span');
      s.className = 'customers-neighbors__hit-score';
      s.textContent = score.toFixed(3);
      li.append(a, s);
      hitsList.append(li);
    }
  }

  function render() {
    if (!query) return;
    const { u, v, hits, at } = query;
    const q = at ? placePoint(at) : place(u, v);
    for (const el of [dot, ring]) {
      el.style.left = `${q.left}%`;
      el.style.top = `${q.top}%`;
    }

    const near = new Set(hits.map((h) => h.point.id));
    for (const p of points) p.el.classList.toggle('is-neighbor', near.has(p.id));
    panel.classList.add('has-query');

    const rect = panel.getBoundingClientRect();
    lines.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    lines.replaceChildren(
      ...hits.map(({ point }) => {
        const t = placePoint(point);
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', (q.left / 100) * rect.width);
        line.setAttribute('y1', (q.top / 100) * rect.height);
        line.setAttribute('x2', (t.left / 100) * rect.width);
        line.setAttribute('y2', (t.top / 100) * rect.height);
        return line;
      }),
    );
  }

  // `at` pins the query dot to a logo, so it sits on it in either orientation.
  function showCosine(u, v, precomputed, label, at = null) {
    const hits = precomputed.slice(0, limit).map((h) => ({ point: byId[h.id], score: h.cosine }));
    query = { u, v, hits, at };
    renderHits(hits, label);
    render();
  }

  function selectChip(id) {
    const chip = space.queries.find((c) => c.id === id);
    if (!chip) return;
    for (const el of chips) el.setAttribute('aria-pressed', String(el.dataset.query === id));
    showCosine(chip.x * W, chip.y * H, chip.hits, 'cosine');
  }

  function dropAt(u, v) {
    u = Math.min(W, Math.max(0, u));
    v = Math.min(H, Math.max(0, v));
    for (const el of chips) el.setAttribute('aria-pressed', 'false');
    const hits = rankByDistance(u, v);
    query = { u, v, hits };
    renderHits(hits, 'map score');
    render();
  }

  chips.forEach((el) => el.addEventListener('click', () => selectChip(el.dataset.query)));

  panel.addEventListener('click', (event) => {
    const target = event.target.closest('[data-point]');
    if (target) {
      const p = byId[target.dataset.point];
      for (const el of chips) el.setAttribute('aria-pressed', 'false');
      showCosine(p.u, p.v, p.hits, 'centered cosine', p);
      return;
    }
    const rect = panel.getBoundingClientRect();
    const fx = (event.clientX - rect.left) / rect.width;
    const fy = (event.clientY - rect.top) / rect.height;
    if (isPortrait()) dropAt(fy * W, fx * H);
    else dropAt(fx * W, fy * H);
  });

  panel.addEventListener('keydown', (event) => {
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const move = moves[event.key];
    if (!move || !query) return;
    event.preventDefault();
    let [dx, dy] = move;
    if (isPortrait()) [dx, dy] = [dy, dx];
    dropAt(query.u + dx * KEY_STEP, query.v + dy * KEY_STEP);
  });

  window.addEventListener('resize', render);
  selectChip(space.queries[0].id);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-customers-neighbors]').forEach(initNeighbors);
});
