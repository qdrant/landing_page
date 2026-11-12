const NS = 'http://www.w3.org/2000/svg';
const DESKTOP = { width: 900, height: 460 };
const MOBILE = { width: 354, height: 350 };
const STACK_AT = 560;

const POSITIVES = [
  { id: 'wooden dining chair', x: 360, y: 250 },
  { id: 'oak dining table', x: 390, y: 275 },
];
const NEGATIVE = { id: 'metal standing desk', x: 660, y: 255 };
const CANDIDATES = [
  { id: 'walnut bookshelf', x: 115, y: 120 },
  { id: 'oak chest of drawers', x: 245, y: 285 },
  { id: 'velvet armchair', x: 215, y: 165 },
  { id: 'pine bedside table', x: 240, y: 400 },
  { id: 'ergonomic office chair', x: 495, y: 115 },
];
const FILLERS = [
  { x: 600, y: 180 }, { x: 760, y: 230 }, { x: 830, y: 320 }, { x: 800, y: 440 },
  { x: 850, y: 250 }, { x: 840, y: 150 }, { x: 60, y: 150 }, { x: 90, y: 340 },
  { x: 45, y: 440 },
];
const R = { filler: 6, candidate: 8, person: 10, combined: 11, ringPad: 7 };
const QUERY = combinedQuery(POSITIVES, NEGATIVE);

// --- Desktop label auto-placement ------------------------------------------
// The label text (up to ~300px at this font size) is often wider than the
// gaps between points in this cluster, so hand-picked positions kept
// clashing. Instead, try a ring of above/below/left/right offsets around
// each point and keep the first one that clears every other point (plus its
// ring) and every label already placed.
const FONT = 23;
const CHAR_W = FONT * 0.62;
const ABOVE_BASELINE = 21;
const BELOW_BASELINE = 10;
const BOUNDS = { left: 8, right: DESKTOP.width - 8, top: 8, bottom: DESKTOP.height - 8 };

function textBox(anchor, x, y, text) {
  const w = text.length * CHAR_W;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return { left, right: left + w, top: y - ABOVE_BASELINE, bottom: y + BELOW_BASELINE };
}

function boxesOverlap(a, b) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function pointBox(point, radius) {
  return { left: point.x - radius, right: point.x + radius, top: point.y - radius, bottom: point.y + radius };
}

function placeLabels(labelPoints, obstacleBoxes) {
  const placed = new Map();
  const placedBoxes = [];
  labelPoints.forEach((point) => {
    const candidates = [];
    [26, 36, 48, 64, 84, 108, 136].forEach((d) => {
      candidates.push(['middle', point.x, point.y - d]);
      candidates.push(['middle', point.x, point.y + d + ABOVE_BASELINE]);
      candidates.push(['end', point.x - d, point.y + 7]);
      candidates.push(['start', point.x + d, point.y + 7]);
      candidates.push(['end', point.x - d, point.y - d + 7]);
      candidates.push(['start', point.x + d, point.y - d + 7]);
      candidates.push(['end', point.x - d, point.y + d + 7]);
      candidates.push(['start', point.x + d, point.y + d + 7]);
    });
    const all = candidates.map(([anchor, x, y]) => {
      const box = textBox(anchor, x, y, point.id);
      const inBounds = box.left >= BOUNDS.left && box.right <= BOUNDS.right && box.top >= BOUNDS.top && box.bottom <= BOUNDS.bottom;
      const overlaps = obstacleBoxes.filter((o) => boxesOverlap(box, o)).length
        + placedBoxes.filter((b) => boxesOverlap(box, b)).length;
      return { anchor, x, y, box, inBounds, overlaps };
    });
    // Prefer a fully clear, in-bounds spot; otherwise the in-bounds option
    // that overlaps the fewest boxes (an in-bounds label can still touch a
    // filler point without failing the check floor).
    const clean = all.find((c) => c.inBounds && c.overlaps === 0);
    const pick = clean || all.filter((c) => c.inBounds).sort((a, b) => a.overlaps - b.overlaps)[0] || all[0];
    placed.set(point.id, [pick.x, pick.y, pick.anchor]);
    placedBoxes.push(pick.box);
  });
  return placed;
}

const LABEL_OBSTACLES = [
  ...POSITIVES.map((p) => pointBox(p, R.person + 3)),
  pointBox(NEGATIVE, R.person + 3),
  ...CANDIDATES.map((c) => pointBox(c, R.candidate + R.ringPad + 3)),
  ...FILLERS.map((f) => pointBox(f, R.filler + 3)),
  pointBox(QUERY, R.combined + 3),
];
// Densest cluster first, so those points get first pick of open space.
const LABEL_ORDER = [
  CANDIDATES[1], CANDIDATES[2], POSITIVES[0], POSITIVES[1], CANDIDATES[3],
  CANDIDATES[0], CANDIDATES[4], NEGATIVE, { ...QUERY, id: 'combined query' },
];
const LABELS = placeLabels(LABEL_ORDER, LABEL_OBSTACLES);

function svg(name, attrs = {}, text) {
  const element = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  if (text != null) element.textContent = text;
  return element;
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function average(points) {
  return points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
}

function combinedQuery(positives, negative) {
  const mean = average(positives);
  return { x: 2 * mean.x - negative.x, y: 2 * mean.y - negative.y };
}

function closestPositive(point) {
  return [...POSITIVES].sort((a, b) => distance(point, a) - distance(point, b))[0];
}

function rankCandidates(query, positives, negative) {
  const averageRank = [...CANDIDATES].sort((a, b) => distance(a, query) - distance(b, query));
  const eligible = CANDIDATES.filter((candidate) => {
    const closest = Math.min(...positives.map((point) => distance(candidate, point)));
    return closest < distance(candidate, negative);
  });
  const bestRank = eligible.sort((a, b) => {
    const aScore = Math.min(...positives.map((point) => distance(a, point)));
    const bScore = Math.min(...positives.map((point) => distance(b, point)));
    return aScore - bScore;
  });
  const expectedAverage = ['walnut bookshelf', 'oak chest of drawers', 'velvet armchair', 'pine bedside table'];
  const expectedBest = ['oak chest of drawers', 'velvet armchair', 'ergonomic office chair', 'pine bedside table'];
  if (averageRank.slice(0, 4).map((point) => point.id).join('|') !== expectedAverage.join('|')) {
    throw new Error(`average_vector ranking assertion failed: ${averageRank.map((point) => point.id)}`);
  }
  if (bestRank.slice(0, 4).map((point) => point.id).join('|') !== expectedBest.join('|')) {
    throw new Error(`best_score ranking assertion failed: ${bestRank.map((point) => point.id)}`);
  }
  return { averageRank, bestRank };
}

export function mount(node) {
  node.classList.add('qi-rd');
  node.innerHTML = `<div class="qi-fig">
    <div class="qi-controls">
      <button type="button" class="qi-chip" data-mode="average_vector" aria-pressed="true">average_vector</button>
      <button type="button" class="qi-chip" data-mode="best_score" aria-pressed="false">best_score</button>
    </div>
    <svg class="qi-svg qi-rd__svg" role="img" aria-label="Positive and negative examples and candidates illustrate average_vector and best_score recommendations.">
      <defs>
        <marker id="qi-rd-arrow-attract" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10Z" class="qi-rd__arrowhead qi-rd__arrowhead--attract" />
        </marker>
        <marker id="qi-rd-arrow-push" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10Z" class="qi-rd__arrowhead qi-rd__arrowhead--push" />
        </marker>
      </defs>
      <g class="qi-rd__lines"></g>
      <g class="qi-rd__points"></g>
      <g class="qi-rd__labels"></g>
    </svg>
    <p class="qi-status qi-rd__status" role="status" aria-live="polite"></p>
  </div>`;

  const svgRoot = node.querySelector('.qi-rd__svg');
  const linesGroup = node.querySelector('.qi-rd__lines');
  const pointsGroup = node.querySelector('.qi-rd__points');
  const labelsGroup = node.querySelector('.qi-rd__labels');
  const status = node.querySelector('.qi-rd__status');
  const controls = [...node.querySelectorAll('[data-mode]')];
  const query = QUERY;
  const mean = average(POSITIVES);
  const rankings = rankCandidates(query, POSITIVES, NEGATIVE);
  const averageResults = rankings.averageRank.slice(0, 4);
  const bestResults = rankings.bestRank.slice(0, 4);
  let mode = 'average_vector';
  let stacked = null;

  function isExcludedFiller(point) {
    return Math.min(...POSITIVES.map((p) => distance(point, p))) >= distance(point, NEGATIVE);
  }

  function dot(parent, point, className, radius) {
    parent.appendChild(svg('circle', { class: className, cx: point.x, cy: point.y, r: radius }));
  }

  function unit(a, b) {
    const d = distance(a, b);
    return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
  }

  // Short stub arrow starting near `origin`, in direction `dir`, without
  // reaching the other end: both the "pull toward the combined query"
  // arrows and the "desk pushes away" arrow only need to show a direction,
  // not literally connect the two points (which would cross candidates
  // sitting between them).
  function stub(parent, origin, dir, standoff, length, markerId, className) {
    parent.appendChild(svg('line', {
      x1: origin.x + dir.x * standoff, y1: origin.y + dir.y * standoff,
      x2: origin.x + dir.x * (standoff + length), y2: origin.y + dir.y * (standoff + length),
      class: className, 'marker-end': `url(#${markerId})`,
    }));
  }

  function link(parent, from, to) {
    const d = distance(from, to);
    const ux = (to.x - from.x) / d;
    const uy = (to.y - from.y) / d;
    parent.appendChild(svg('line', {
      x1: from.x + ux * 11, y1: from.y + uy * 11,
      x2: to.x - ux * 11, y2: to.y - uy * 11,
      class: 'qi-rd__link',
    }));
  }

  function drawDesktop(selected, other) {
    FILLERS.forEach((point) => {
      const role = mode === 'best_score' && isExcludedFiller(point) ? 'excluded' : 'filler';
      dot(pointsGroup, point, `qi-rd__point qi-rd__point--${role}`, R.filler);
    });

    if (mode === 'average_vector') {
      POSITIVES.forEach((point) => stub(linesGroup, point, unit(point, query), R.person + 4, 46, 'qi-rd-arrow-attract', 'qi-rd__arrow qi-rd__arrow--attract'));
      stub(linesGroup, NEGATIVE, unit(mean, NEGATIVE), R.person + 4, 46, 'qi-rd-arrow-push', 'qi-rd__arrow qi-rd__arrow--push');
    } else {
      selected.forEach((candidate) => link(linesGroup, candidate, closestPositive(candidate)));
    }

    POSITIVES.forEach((point) => dot(pointsGroup, point, 'qi-rd__point qi-rd__point--positive', R.person));
    dot(pointsGroup, NEGATIVE, 'qi-rd__point qi-rd__point--negative', R.person);

    CANDIDATES.forEach((candidate) => {
      const isSelected = selected.includes(candidate);
      const isOther = other.includes(candidate);
      const role = isSelected ? 'result' : isOther ? 'faded' : 'candidate';
      dot(pointsGroup, candidate, `qi-rd__point qi-rd__point--${role}`, R.candidate);
      if (isSelected) {
        dot(pointsGroup, candidate, isOther ? 'qi-rd__ring' : 'qi-rd__ring qi-rd__ring--new', R.candidate + R.ringPad);
      }
    });

    if (mode === 'average_vector') {
      dot(pointsGroup, query, 'qi-rd__point qi-rd__point--combined', R.combined);
    }

    [...POSITIVES, NEGATIVE, ...CANDIDATES].forEach((point) => {
      const [x, y, anchor] = LABELS.get(point.id);
      labelsGroup.appendChild(svg('text', { class: 'qi-label', x, y, 'text-anchor': anchor }, point.id));
    });
    if (mode === 'average_vector') {
      const [qx, qy, qAnchor] = LABELS.get('combined query');
      labelsGroup.appendChild(svg('text', { class: 'qi-label', x: qx, y: qy, 'text-anchor': qAnchor }, 'combined query'));
    }
  }

  function legendRow(y, label, role, ringed) {
    const cx = 18;
    dot(pointsGroup, { x: cx, y }, `qi-rd__point qi-rd__point--${role}`, 6);
    if (ringed) dot(pointsGroup, { x: cx, y }, ringed, 11);
    labelsGroup.appendChild(svg('text', { class: 'qi-label', x: cx + 16, y: y + 5, 'text-anchor': 'start' }, label));
  }

  function drawMobile(selected, other) {
    const step = 34;
    let y = 22;
    POSITIVES.forEach((point) => { legendRow(y, point.id, 'positive'); y += step; });
    legendRow(y, NEGATIVE.id, 'negative'); y += step;
    CANDIDATES.forEach((candidate) => {
      const isSelected = selected.includes(candidate);
      const isOther = other.includes(candidate);
      const role = isSelected ? 'result' : isOther ? 'faded' : 'candidate';
      const ringed = isSelected ? (isOther ? 'qi-rd__ring' : 'qi-rd__ring qi-rd__ring--new') : null;
      legendRow(y, candidate.id, role, ringed);
      y += step;
    });
    if (mode === 'average_vector') legendRow(y, 'combined query', 'combined');
  }

  function draw() {
    pointsGroup.replaceChildren();
    labelsGroup.replaceChildren();
    linesGroup.replaceChildren();
    const selected = mode === 'average_vector' ? averageResults : bestResults;
    const other = mode === 'average_vector' ? bestResults : averageResults;

    if (stacked) drawMobile(selected, other);
    else drawDesktop(selected, other);

    status.textContent = mode === 'average_vector'
      ? 'average_vector: results are walnut bookshelf, oak chest of drawers, velvet armchair, pine bedside table.'
      : 'best_score: results are oak chest of drawers, velvet armchair, ergonomic office chair, pine bedside table. The office chair replaces the walnut bookshelf.';
    controls.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  }

  function setLayout(width) {
    stacked = width < STACK_AT;
    const layout = stacked ? MOBILE : DESKTOP;
    svgRoot.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
    draw();
  }

  controls.forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    draw();
  }));

  let lastWidth = 0;
  const observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width || node.getBoundingClientRect().width;
    if (width > 0 && (Math.abs(width - lastWidth) > 1 || (width < STACK_AT) !== stacked)) {
      lastWidth = width;
      setLayout(width);
    }
  });
  observer.observe(node);
  setLayout(node.getBoundingClientRect().width || DESKTOP.width);
  // Self-correct one frame later: on a page that is still settling (e.g. a
  // long article mid-scroll when this mounts), the very first width read can
  // be stale before the ResizeObserver's own initial callback lands.
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      const width = node.getBoundingClientRect().width;
      if (width > 0 && (width < STACK_AT) !== stacked) setLayout(width);
    });
  }
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
