// Word-map data: 631 words embedded with all-MiniLM-L6-v2 (FastEmbed), projected to 2-D with UMAP
// (n_neighbors=15, min_dist=0.15, cosine, random_state=42). Nearest neighbors computed by Qdrant
// in the full 384-d space (cosine). Loaded at runtime from /articles_data/what-are-embeddings/word-map.json.

// Coordinates stay in data space; project into CSS pixels so labels and hit
// targets retain their size through zoom, resize, and the stacked layout.
const NS = 'http://www.w3.org/2000/svg';
const FULL = { x: 500, y: 500, size: 1120 };
const HELP = 'Select a preset, search a word, or click a dot. Arrow keys explore focused dots. Ctrl/Cmd + wheel zooms; drag to pan.';
let instance = 0;

function svgElement(name, attrs) {
  const element = document.createElementNS(NS, name);
  for (const key in attrs) element.setAttribute(key, attrs[key]);
  return element;
}

export async function mount(node) {
  try {
    const response = await fetch('/articles_data/what-are-embeddings/word-map.json');
    if (!response.ok) throw new Error(`Word-map data request failed: ${response.status}`);
    const data = await response.json();
    renderMap(node, data);
  } catch (error) {
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
  }
}

function renderMap(node, WORD_MAP) {
  node.classList.add('qi-wm');
  const id = `qi-wm-${++instance}`;
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-controls">
        <div class="qi-group" role="group" aria-label="Example words">
          ${['pretty', 'ugly', 'neutral'].map(word => `<button type="button" class="qi-chip" data-preset="${word}" aria-pressed="false">${word}</button>`).join('')}
        </div>
        <form class="qi-group" role="search" aria-label="Find a map word">
          <label for="${id}-search">Word</label>
          <input id="${id}-search" type="search" list="${id}-words" placeholder="Search 631 words" autocomplete="off">
          <datalist id="${id}-words"></datalist>
          <button class="qi-chip" type="submit">Select</button>
        </form>
        <div class="qi-group" role="group" aria-label="Map view">
          <button type="button" class="qi-chip" data-zoom="0.8" aria-label="Zoom in">+</button>
          <button type="button" class="qi-chip" data-zoom="1.25" aria-label="Zoom out">−</button>
          <button type="button" class="qi-chip" data-reset>Reset</button>
        </div>
      </div>
      <div class="qi-wm__legend" aria-label="Word categories"></div>
      <div class="qi-wm__layout">
        <div class="qi-wm__map" role="group" aria-label="Word map. Use arrow keys on a dot to explore words, and Enter or Space to select.">
          <svg class="qi-svg" aria-hidden="true">
            <rect class="qi-frame" x="1" y="1" rx="6"/>
            <g class="qi-wm__lines"></g><g class="qi-wm__dots"></g>
          </svg>
          <div class="qi-wm__hits"></div>
          <span class="qi-label qi-wm__label" hidden></span>
        </div>
        <div class="qi-wm__neighbors">
          <p class="qi-wm__heading">8 nearest neighbors</p>
          <p class="qi-wm__empty">Select a word to compare cosine similarity in 384 dimensions.</p>
          <ol aria-label="Nearest neighbors and cosine similarity"></ol>
        </div>
      </div>
      <p class="qi-status qi-status--2" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  const find = selector => node.querySelector(selector);
  const map = find('.qi-wm__map');
  const svg = find('svg');
  const frame = find('.qi-frame');
  const lines = find('.qi-wm__lines');
  const dots = find('.qi-wm__dots');
  const hits = find('.qi-wm__hits');
  const label = find('.qi-wm__label');
  const list = find('ol');
  const search = find('input');
  const status = find('.qi-status');
  const presets = [...node.querySelectorAll('[data-preset]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const color = category => WORD_MAP.colored.includes(category) ? `var(--wm-${category})` : 'var(--qi-muted)';
  const category = i => WORD_MAP.cats[WORD_MAP.cat[i]];
  const point = i => ({ x: WORD_MAP.xy[i * 2], y: 1000 - WORD_MAP.xy[i * 2 + 1] });
  const swatch = cat => {
    const span = document.createElement('span');
    span.className = 'qi-chip__swatch';
    span.style.setProperty('--swatch', color(cat));
    span.setAttribute('aria-hidden', 'true');
    return span;
  };
  [...WORD_MAP.colored, 'other (8 categories)'].forEach(cat => {
    const entry = document.createElement('span');
    entry.append(swatch(cat), document.createTextNode(cat));
    find('.qi-wm__legend').append(entry);
  });
  WORD_MAP.words.forEach(word => {
    const option = document.createElement('option');
    option.value = word;
    find('datalist').append(option);
  });

  let selected = null;
  let hovered = null;
  let focused = null;
  let roving = 0;
  let neighbors = [];
  let camera = { ...FULL };
  let width = 1;
  let height = 1;
  let animation = 0;
  let drag = null;
  let dragged = false;
  const circles = [];
  const buttons = [];
  const scale = () => Math.min(width, height) / camera.size;
  const project = i => {
    const p = point(i);
    return { x: width / 2 + (p.x - camera.x) * scale(), y: height / 2 + (p.y - camera.y) * scale() };
  };

  function renderLabel() {
    const i = hovered ?? focused ?? selected;
    label.hidden = i === null;
    if (i === null) return;
    const p = project(i);
    label.textContent = WORD_MAP.words[i];
    label.hidden = p.x < 0 || p.x > width || p.y < 0 || p.y > height;
    label.style.left = `${Math.max(4, Math.min(width - label.offsetWidth - 4, p.x + 10))}px`;
    label.style.top = `${Math.max(4, Math.min(height - label.offsetHeight - 4, p.y - 30))}px`;
  }

  function renderView() {
    circles.forEach((circle, i) => {
      const p = project(i);
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      buttons[i].style.left = `${p.x}px`;
      buttons[i].style.top = `${p.y}px`;
      buttons[i].hidden = p.x < 6 || p.x > width - 6 || p.y < 6 || p.y > height - 6;
    });
    // Keep one visible entry point to the map after panning away from a word.
    if (buttons[roving].hidden) {
      const visible = buttons.findIndex(button => !button.hidden);
      if (visible >= 0) {
        buttons[roving].tabIndex = -1;
        roving = visible;
        buttons[roving].tabIndex = 0;
      }
    }
    if (selected !== null) {
      const start = project(selected);
      [...lines.children].forEach((line, j) => {
        const end = project(neighbors[j]);
        for (const [key, value] of Object.entries({ x1: start.x, y1: start.y, x2: end.x, y2: end.y })) line.setAttribute(key, value);
      });
    }
    renderLabel();
  }

  function moveTo(target, animate = true) {
    cancelAnimationFrame(animation);
    if (!animate || reducedMotion.matches) {
      camera = { ...target };
      renderView();
      return;
    }
    const start = { ...camera };
    const began = performance.now();
    function tick(now) {
      if (!node.isConnected) return;
      const t = reducedMotion.matches ? 1 : Math.min(1, (now - began) / 280);
      const eased = 1 - (1 - t) ** 3;
      for (const key of ['x', 'y', 'size']) camera[key] = start[key] + (target[key] - start[key]) * eased;
      renderView();
      if (t < 1) animation = requestAnimationFrame(tick);
    }
    animation = requestAnimationFrame(tick);
  }

  function select(i, animate = true) {
    selected = i;
    hovered = null;
    neighbors = i === null ? [] : WORD_MAP.nn.slice(i * WORD_MAP.k, (i + 1) * WORD_MAP.k);
    const active = new Set([i, ...neighbors]);
    circles.forEach((circle, j) => {
      circle.classList.toggle('is-faded', i !== null && !active.has(j));
      circle.classList.toggle('is-selected', i === j);
      circle.setAttribute('r', i === j ? 5 : active.has(j) ? 4 : 3);
      buttons[j].setAttribute('aria-pressed', String(i === j));
    });
    presets.forEach(button => button.setAttribute('aria-pressed', String(WORD_MAP.words[i] === button.dataset.preset)));
    lines.replaceChildren(...neighbors.map(() => svgElement('line', {})));
    // Reuse list buttons so selecting a neighbor does not discard keyboard focus.
    [...list.children].forEach((li, j) => {
      const neighbor = neighbors[j];
      li.hidden = neighbor === undefined;
      if (neighbor === undefined) return;
      const button = li.firstChild;
      const score = (WORD_MAP.sim[i * WORD_MAP.k + j] / 1000).toFixed(2);
      const word = document.createElement('span');
      word.textContent = WORD_MAP.words[neighbor];
      const value = document.createElement('span');
      value.className = 'qi-wm__score';
      value.textContent = score;
      button.replaceChildren(swatch(category(neighbor)), word, value);
      button.setAttribute('aria-label', `${WORD_MAP.words[neighbor]}, ${category(neighbor)}, cosine similarity ${score}. Select word.`);
    });
    find('.qi-wm__empty').hidden = i !== null;
    find('.qi-wm__heading').textContent = i === null ? '8 nearest neighbors' : `Nearest to "${WORD_MAP.words[i]}"`;
    search.value = i === null ? '' : WORD_MAP.words[i];
    search.setCustomValidity('');
    if (i === null) {
      status.textContent = HELP;
      moveTo(FULL, animate);
      return;
    }
    const counts = new Map();
    neighbors.forEach(j => counts.set(category(j), (counts.get(category(j)) || 0) + 1));
    const other = [...counts].filter(([cat]) => cat !== category(i)).sort((a, b) => b[1] - a[1]);
    // A strict majority is meaningful cross-category mixing; otherwise state
    // the spread instead of suggesting one category dominates a scattered set.
    status.textContent = other[0]?.[1] > WORD_MAP.k / 2
      ? `${other[0][1]} of ${WORD_MAP.words[i]}'s ${WORD_MAP.k} nearest neighbors are ${other[0][0]} words.`
      : `${WORD_MAP.words[i]}'s ${WORD_MAP.k} nearest neighbors come from ${counts.size} ${counts.size === 1 ? 'category' : 'categories'}: ${[...counts].map(([cat, count]) => `${cat} (${count})`).join(', ')}.`;
    const points = [i, ...neighbors].map(point);
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    moveTo({ x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2,
      size: Math.max(100, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.4 }, animate);
  }

  WORD_MAP.words.forEach((word, i) => {
    const circle = svgElement('circle', { r: 3, fill: color(category(i)) });
    circles.push(circle);
    dots.append(circle);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'qi-wm__dot';
    button.tabIndex = i === 0 ? 0 : -1;
    button.setAttribute('aria-label', `${word}, ${category(i)}. Select word.`);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', event => { if (!dragged || event.detail === 0) select(i); });
    button.addEventListener('pointerenter', () => { if (!drag) { hovered = i; renderLabel(); } });
    button.addEventListener('pointerleave', () => { hovered = null; renderLabel(); });
    button.addEventListener('focus', () => {
      buttons[roving].tabIndex = -1;
      roving = i;
      button.tabIndex = 0;
      focused = i;
      renderLabel();
    });
    button.addEventListener('blur', () => { focused = null; renderLabel(); });
    button.addEventListener('keydown', event => {
      const direction = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!direction) return;
      event.preventDefault();
      const next = (i + direction + buttons.length) % buttons.length;
      const p = project(next);
      if (p.x < 12 || p.x > width - 12 || p.y < 32 || p.y > height - 12) moveTo({ ...camera, ...point(next) }, false);
      buttons[next].focus({ preventScroll: true });
    });
    buttons.push(button);
    hits.append(button);
  });
  for (let j = 0; j < WORD_MAP.k; j++) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'qi-chip';
    button.addEventListener('click', () => select(neighbors[j]));
    li.append(button);
    list.append(li);
  }
  presets.forEach(button => button.addEventListener('click', () => select(WORD_MAP.words.indexOf(button.dataset.preset))));
  find('form').addEventListener('submit', event => {
    event.preventDefault();
    const i = WORD_MAP.words.indexOf(search.value.trim().toLowerCase());
    if (i >= 0) select(i);
    else {
      search.setCustomValidity('Choose a word from the 631-word map.');
      search.reportValidity();
      status.textContent = 'No matching word. Choose a suggestion or try pretty, ugly, or neutral.';
    }
  });
  search.addEventListener('input', () => search.setCustomValidity(''));
  find('[data-reset]').addEventListener('click', () => select(null));
  function zoom(factor, x = width / 2, y = height / 2, animate = true) {
    const size = Math.max(60, Math.min(2400, camera.size * factor));
    const change = (1 - size / camera.size) / scale();
    moveTo({ x: camera.x + (x - width / 2) * change, y: camera.y + (y - height / 2) * change, size }, animate);
  }
  node.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => zoom(Number(button.dataset.zoom))));
  map.addEventListener('wheel', event => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const bounds = map.getBoundingClientRect();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
    zoom(Math.exp(Math.max(-1, Math.min(1, delta * 0.002))), event.clientX - bounds.left, event.clientY - bounds.top, false);
  }, { passive: false });
  map.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    cancelAnimationFrame(animation);
    dragged = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: { ...camera } };
  });
  map.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!dragged && Math.hypot(dx, dy) < 4) return;
    dragged = true;
    map.setPointerCapture(event.pointerId);
    hovered = null;
    moveTo({ ...drag.camera, x: drag.camera.x - dx / scale(), y: drag.camera.y - dy / scale() }, false);
  });
  const endDrag = () => { drag = null; };
  map.addEventListener('pointerup', endDrag);
  map.addEventListener('pointercancel', endDrag);
  map.addEventListener('lostpointercapture', endDrag);
  map.addEventListener('pointerleave', () => { if (!dragged) drag = null; });
  function resizeView() {
    width = map.clientWidth;
    height = map.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    frame.setAttribute('width', Math.max(0, width - 2));
    frame.setAttribute('height', Math.max(0, height - 2));
    renderView();
  }
  const resize = new ResizeObserver(resizeView);
  resize.observe(map);
  resizeView();
  select(WORD_MAP.words.indexOf('ugly'), false);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
