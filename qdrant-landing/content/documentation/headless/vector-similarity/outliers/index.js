const NS = 'http://www.w3.org/2000/svg';
const VIEW = { width: 900, height: 570 };
const PHOTOS = '/articles_data/vector-similarity-beyond-search/photos/';
const CLOUD = [
  [300, 135], [330, 230], [360, 280], [460, 120], [500, 195], [530, 300],
  [580, 125], [600, 340], [680, 175], [310, 390], [520, 465], [690, 350],
];
const REFERENCES = [
  { image: 'wooden-dining-chair.png', point: [360, 170], label: 'Reference #1' },
  { image: 'oak-dining-chair.png', point: [390, 335], label: 'Reference #2' },
  // Pulled further down (was [430, 480]) so there is room beside it for the
  // office chair without crowding Reference #2 or the candidate tiles.
  { image: 'office-chair.png', point: [430, 535], label: 'Reference #3' },
];
const CANDIDATES = [
  { id: 'caster wheels', image: 'caster-wheels.png', point: [690, 255], label: 'Anomaly', flaggedRole: 'bad' },
  // Point moved up next to References #1/#2 (was [650, 440], near Reference
  // #3): moderately close to all three references, close to none of them,
  // so its min distance is clearly larger than the office chair's (flagged
  // under best_score) while its summed distance stays clearly smaller than
  // the office chair's (not flagged under sum_scores). The photo tile stays
  // on the right; only the dashed connector to it gets longer.
  { id: 'egg chair', image: 'rattan-egg-chair.png', point: [430, 250], label: 'Review candidate', flaggedRole: 'review' },
];
// A normal item with no photo, placed right beside Reference #3 (~40 units
// away) and far from #1 and #2. best_score (nearest reference wins) rates it
// normal; sum_scores (summed distance to every reference) rates it anomalous
// instead of the egg chair. See computeRankings() for the assertion this
// depends on.
const OFFICE_CHAIR = { id: 'office chair', point: [470, 535], label: 'office chair', flaggedRole: 'bad' };
const DESKTOP_REFERENCE_POINTS = REFERENCES.map((ref) => ref.point);
const DESKTOP_SCORED = [CANDIDATES[0], CANDIDATES[1], OFFICE_CHAIR];

function svg(name, attrs = {}, text) {
  const element = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  if (text != null) element.textContent = text;
  return element;
}

function distance(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

// --- Ranking: similarity = -euclidean distance, so the nearest/summed
// reference distance stands in for a score, as relative-distance does. -----
function minDistanceToReferences(point, referencePoints) {
  return Math.min(...referencePoints.map((ref) => distance(point, ref)));
}

function sumDistanceToReferences(point, referencePoints) {
  return referencePoints.reduce((total, ref) => total + distance(point, ref), 0);
}

function rankDescending(scored, scoreFn) {
  return [...scored].sort((a, b) => scoreFn(b.point) - scoreFn(a.point));
}

function nearestReferenceIndex(point, referencePoints) {
  let bestIndex = 0;
  let bestDistance = Infinity;
  referencePoints.forEach((ref, index) => {
    const d = distance(point, ref);
    if (d < bestDistance) { bestDistance = d; bestIndex = index; }
  });
  return bestIndex;
}

// Nearest reference per candidate, for one layout's coordinates. best_score
// draws its single connector to this reference.
function nearestReferenceIndices(referencePoints, scored) {
  return Object.fromEntries(scored.map((item) => [item.id, nearestReferenceIndex(item.point, referencePoints)]));
}

// Validates one layout's coordinates against the article's story and
// returns which candidates are flagged per mode. Throws if the geometry
// doesn't produce it: wheels always top (most anomalous) in both rankings;
// best_score (nearest reference) flags wheels + egg chair, with the office
// chair clearly closer to its nearest reference (< 0.5x the egg chair's);
// sum_scores (summed distance) flags wheels + office chair instead, with
// the office chair clearly farther in total (> 1.2x the egg chair's sum).
function computeRankings(referencePoints, scored, layoutName) {
  const byId = Object.fromEntries(scored.map((item) => [item.id, item.point]));
  const bestIds = rankDescending(scored, (p) => minDistanceToReferences(p, referencePoints)).map((item) => item.id);
  const sumIds = rankDescending(scored, (p) => sumDistanceToReferences(p, referencePoints)).map((item) => item.id);
  if (bestIds[0] !== 'caster wheels' || bestIds[1] !== 'egg chair' || bestIds[2] !== 'office chair') {
    throw new Error(`${layoutName} best_score ranking assertion failed: ${bestIds.join(' > ')}`);
  }
  if (sumIds[0] !== 'caster wheels' || sumIds[1] !== 'office chair') {
    throw new Error(`${layoutName} sum_scores ranking assertion failed: ${sumIds.join(' > ')}`);
  }
  const officeMin = minDistanceToReferences(byId['office chair'], referencePoints);
  const eggMin = minDistanceToReferences(byId['egg chair'], referencePoints);
  const officeSum = sumDistanceToReferences(byId['office chair'], referencePoints);
  const eggSum = sumDistanceToReferences(byId['egg chair'], referencePoints);
  if (!(officeMin < 0.5 * eggMin)) {
    throw new Error(`${layoutName} best_score margin assertion failed: office min ${officeMin.toFixed(1)} not < 0.5x egg min ${eggMin.toFixed(1)}`);
  }
  if (!(officeSum > 1.2 * eggSum)) {
    throw new Error(`${layoutName} sum_scores margin assertion failed: office sum ${officeSum.toFixed(1)} not > 1.2x egg sum ${eggSum.toFixed(1)}`);
  }
  return {
    best_score: new Set(bestIds.slice(0, 2)),
    sum_scores: new Set(sumIds.slice(0, 2)),
  };
}

// Two kinds of line: 'assoc' (dotted, faint) ties a photo to its point in
// the embedding space; 'near' (solid, in the item's color) measures the
// distance from a scored item to a reference.
function addLink(parent, from, to, endInset = 12, startInset = 0, kind = 'assoc', role = 'plain') {
  const length = distance(from, to);
  const ux = (to[0] - from[0]) / length;
  const uy = (to[1] - from[1]) / length;
  parent.appendChild(svg('line', {
    class: kind === 'assoc' ? 'qi-outlier__link' : `qi-outlier__near qi-outlier__near--${role}`,
    x1: from[0] + ux * startInset,
    y1: from[1] + uy * startInset,
    x2: to[0] - ux * endInset,
    y2: to[1] - uy * endInset,
  }));
}

function addPoint(parent, point, role = 'plain', ringed = role !== 'plain') {
  parent.appendChild(svg('circle', {
    class: `qi-outlier__point qi-outlier__point--${role}`,
    cx: point[0], cy: point[1], r: 7,
  }));
  if (ringed) {
    parent.appendChild(svg('circle', {
      class: `qi-outlier__ring qi-outlier__ring--${role}`,
      cx: point[0], cy: point[1], r: 11,
    }));
  }
}

function addTile(parent, image, x, y, width, height, role) {
  parent.appendChild(svg('rect', {
    class: `qi-outlier__tile qi-outlier__tile--${role}`,
    x, y, width, height,
  }));
  parent.appendChild(svg('image', {
    class: `qi-outlier__photo qi-outlier__photo--${role}`,
    href: PHOTOS + image,
    x: x + 6, y: y + 6, width: width - 12, height: height - 12,
    preserveAspectRatio: 'xMidYMid meet',
  }));
}

function addLabel(parent, x, y, value, anchor, extraClass = '') {
  // The stylesheet centers labels; an inline style is the only way to override it.
  const cls = `qi-label ${extraClass}`.trim();
  const attrs = anchor ? { class: cls, x, y, style: `text-anchor: ${anchor}` } : { class: cls, x, y };
  parent.appendChild(svg('text', attrs, value));
}

// A muted candidate (not flagged in the active mode) drops its identity
// color for the shared --qi-muted token; a flagged one keeps it.
function roleFor(item, flaggedIds) {
  return flaggedIds.has(item.id) ? item.flaggedRole : 'muted';
}

export function mount(node) {
  node.classList.add('qi-outlier');
  node.innerHTML = `<div class="qi-fig">
    <div class="qi-controls">
      <button type="button" class="qi-chip" data-mode="best_score" aria-pressed="true">best_score</button>
      <button type="button" class="qi-chip" data-mode="sum_scores" aria-pressed="false">sum_scores</button>
    </div>
    <svg class="qi-svg qi-outlier__svg" role="img" aria-label="Reference chairs anchor a point cloud; best_score and sum_scores ring different candidates as outliers.">
      <g class="qi-outlier__draw"></g>
    </svg>
    <p class="qi-status qi-outlier__status" role="status" aria-live="polite"></p>
  </div>`;

  const svgRoot = node.querySelector('.qi-outlier__svg');
  const drawing = node.querySelector('.qi-outlier__draw');
  const status = node.querySelector('.qi-outlier__status');
  const controls = [...node.querySelectorAll('[data-mode]')];
  const flaggedByMode = computeRankings(DESKTOP_REFERENCE_POINTS, DESKTOP_SCORED, 'desktop');
  const desktopNearest = nearestReferenceIndices(DESKTOP_REFERENCE_POINTS, DESKTOP_SCORED);
  let mode = 'best_score';
  // Which scored item's closeness lines are emphasized; the rest are dimmed.
  // `pinned` is set by a click or tap, `hovered` by a mouse. Under
  // sum_scores nine lines overlap, so the office chair, the item that mode
  // is about, is emphasized until the reader picks another.
  const DEFAULT_FOCUS = { best_score: null, sum_scores: 'office chair' };
  let pinned = DEFAULT_FOCUS[mode];
  let hovered = null;
  let nearLayer = null;

  // Closeness is drawn for every scored item, flagged or not, so the reader
  // can compare them. best_score: one line to the nearest reference.
  // sum_scores: one line to every reference (the score is their sum).
  function drawReferenceLinks(item, referencePoints, nearest, role) {
    const targets = mode === 'best_score' ? [referencePoints[nearest[item.id]]] : referencePoints;
    const group = nearLayer.appendChild(svg('g', { 'data-item': item.id }));
    targets.forEach((refPoint) => addLink(group, item.point, refPoint, 12, 12, 'near', role));
  }

  // A group for one scored item's point, photo, and labels. It is the hover
  // and tap target, with an invisible circle that enlarges the point's.
  function itemGroup(item) {
    const group = drawing.appendChild(svg('g', { class: 'qi-outlier__item', 'data-item': item.id }));
    group.appendChild(svg('circle', { class: 'qi-outlier__hit', cx: item.point[0], cy: item.point[1], r: 22 }));
    return group;
  }

  function applyFocus() {
    const focus = hovered ?? pinned;
    drawing.classList.toggle('has-focus', focus != null);
    drawing.querySelectorAll('[data-item]').forEach((element) => {
      const active = element.dataset.item === focus;
      element.classList.toggle('is-focus', active);
      // Emphasized lines go on top of the dimmed ones.
      if (active && element.parentNode === nearLayer) nearLayer.appendChild(element);
    });
  }

  // The number the active mode ranks by, in units of 100 canvas pixels.
  function scoreText(point, referencePoints) {
    const value = mode === 'best_score'
      ? minDistanceToReferences(point, referencePoints)
      : sumDistanceToReferences(point, referencePoints);
    return `${mode === 'best_score' ? 'nearest' : 'sum'}: ${(value / 100).toFixed(1)}`;
  }

  function drawDesktop() {
    const flagged = flaggedByMode[mode];
    const references = [
      { ...REFERENCES[0], x: 20, y: 38, width: 112, height: 112, pointStart: [132, 94] },
      { ...REFERENCES[1], x: 20, y: 205, width: 112, height: 112, pointStart: [132, 261] },
      { ...REFERENCES[2], x: 20, y: 372, width: 86, height: 128, pointStart: [106, 436] },
    ];
    references.forEach((item) => {
      // Left-aligned to the tile edge, so the narrower office-chair tile cannot push its label off the canvas.
      addLabel(drawing, item.x, item.y - 10, item.label, 'start');
      addLink(drawing, item.pointStart, item.point);
      addTile(drawing, item.image, item.x, item.y, item.width, item.height, 'reference');
      addPoint(drawing, item.point, 'reference');
    });
    const referencePoints = REFERENCES.map((ref) => ref.point);

    CLOUD.forEach((point) => addPoint(drawing, point));
    nearLayer = drawing.appendChild(svg('g'));

    const candidateTiles = [
      { ...CANDIDATES[0], x: 730, y: 205, width: 140, height: 108, labelY: 340 },
      { ...CANDIDATES[1], x: 730, y: 390, width: 118, height: 116, labelY: 535 },
    ];
    candidateTiles.forEach((item) => {
      const active = flagged.has(item.id);
      const role = roleFor(item, flagged);
      const tileEdge = [item.x, item.y + item.height / 2];
      drawReferenceLinks(item, referencePoints, desktopNearest, role);
      const group = itemGroup(item);
      addLink(group, item.point, tileEdge, 0, 12);
      addPoint(group, item.point, role, active);
      addTile(group, item.image, item.x, item.y, item.width, item.height, role);
      addLabel(group, item.x + item.width / 2, item.labelY, item.label);
      addLabel(group, item.x + item.width / 2, item.labelY + 22, scoreText(item.point, referencePoints), null, `qi-outlier__score qi-outlier__score--${role}`);
    });

    // Office chair: a labeled cloud point, no photo (see OFFICE_CHAIR above).
    // Label sits to the right of the point (start-anchored) so it stays
    // unambiguously its own, clear of Reference #3's tile/ring and of the
    // egg chair, which now sits far away near References #1/#2.
    const officeActive = flagged.has(OFFICE_CHAIR.id);
    const officeRole = roleFor(OFFICE_CHAIR, flagged);
    drawReferenceLinks(OFFICE_CHAIR, referencePoints, desktopNearest, officeRole);
    const officeGroup = itemGroup(OFFICE_CHAIR);
    addPoint(officeGroup, OFFICE_CHAIR.point, officeRole, officeActive);
    addLabel(officeGroup, OFFICE_CHAIR.point[0] + 20, OFFICE_CHAIR.point[1] - 4, OFFICE_CHAIR.label, 'start');
    addLabel(officeGroup, OFFICE_CHAIR.point[0] + 20, OFFICE_CHAIR.point[1] + 18, scoreText(OFFICE_CHAIR.point, referencePoints), 'start', `qi-outlier__score qi-outlier__score--${officeRole}`);
  }

  function draw() {
    drawing.replaceChildren();
    drawDesktop();
    applyFocus();
    status.textContent = mode === 'best_score'
      ? 'best_score: an item counts as normal if it is close to any one reference. The caster wheels and the egg chair are flagged.'
      : 'sum_scores: an item far from most references scores low even when it sits next to one. The office chair next to Reference #3 is flagged instead of the egg chair. Hover over or tap an item to see its distances.';
    controls.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  }

  controls.forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    pinned = DEFAULT_FOCUS[mode];
    draw();
  }));

  // Mouse hover previews an item; a click or tap pins it, and a click on
  // empty canvas returns to the mode's default.
  const itemAt = (event) => event.target.closest?.('[data-item]')?.dataset.item ?? null;
  svgRoot.addEventListener('pointerover', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovered = itemAt(event);
    applyFocus();
  });
  svgRoot.addEventListener('pointerleave', () => {
    hovered = null;
    applyFocus();
  });
  svgRoot.addEventListener('click', (event) => {
    pinned = itemAt(event) ?? DEFAULT_FOCUS[mode];
    applyFocus();
  });

  // A single layout at every width: the SVG scales down on narrow screens
  // rather than switching to a rearranged layout, which made the
  // reference/candidate relationships hard to follow.
  svgRoot.setAttribute('viewBox', `0 0 ${VIEW.width} ${VIEW.height}`);
  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
