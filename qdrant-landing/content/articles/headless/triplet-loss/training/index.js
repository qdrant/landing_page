/*
 * Direct gradient descent on illustrative 2D embeddings. Both losses use the
 * same normal samples and training settings. No interpolation or hand-drawn
 * destinations are used: every displayed state is an optimization step.
 * simulate() has no DOM dependencies and also supplies the static SVG export.
 */

export const SETTINGS = Object.freeze({
  seed: 42,
  perClass: 30,
  margin: 0.8,
  learningRate: 0.3,
  steps: 350,
  epsilon: 1e-9,
});

// Fixed across both losses, every step, and all three fallback panels.
export const DOMAIN = Object.freeze({ xMin: -3.85, xMax: 3.85, yMin: -2.2, yMax: 2.2 });

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulate() {
  const { seed, perClass, margin, learningRate, steps, epsilon } = SETTINGS;
  const count = 2 * perClass;
  const pairCount = count * (count - 1) / 2;
  const withinPairCount = perClass * (perClass - 1);
  const totalTriplets = count * (perClass - 1) * perClass;
  const random = mulberry32(seed);
  // Box-Muller normals. 1 - random() keeps the logarithm away from zero.
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const initial = Float64Array.from({ length: 2 * count }, (_, coordinate) =>
    normal() * (coordinate % 2 ? 1 : 0.65) +
    (coordinate % 2 ? 0 : coordinate < 2 * perClass ? -1.3 : 1.3),
  );

  // Reuse scratch buffers. Each snapshot gets independent point positions.
  const distances = new Float64Array(count * count);
  const weights = new Float64Array(count * count);
  const gradient = new Float64Array(2 * count);

  function evaluate(points, mode) {
    weights.fill(0);
    gradient.fill(0);
    let spread = 0;
    let loss = 0;
    let active = 0;
    let violations = 0;

    for (let a = 0; a < count; a++) {
      for (let b = a + 1; b < count; b++) {
        const key = a * count + b;
        const d = Math.hypot(points[2 * a] - points[2 * b], points[2 * a + 1] - points[2 * b + 1]);
        distances[key] = distances[b * count + a] = d;
        const positive = (a < perClass) === (b < perClass);
        if (positive) spread += d;
        if (mode !== 'contrastive') continue;
        // Hadsell, Chopra, and LeCun pairwise loss: d^2 for positives,
        // max(0, margin - d)^2 for negatives, averaged over unordered pairs.
        if (positive) {
          loss += d * d;
          weights[key] = 2 * d;
        } else if (d < margin) {
          loss += (margin - d) ** 2;
          weights[key] = -2 * (margin - d);
        }
      }
    }

    for (let a = 0; a < count; a++) {
      const positiveStart = a < perClass ? 0 : perClass;
      const negativeStart = a < perClass ? perClass : 0;
      for (let p = positiveStart; p < positiveStart + perClass; p++) {
        if (p === a) continue;
        for (let n = negativeStart; n < negativeStart + perClass; n++) {
          const hinge = distances[a * count + p] - distances[a * count + n] + margin;
          // The epsilon is only a reporting/assertion tolerance, not a change
          // to the loss. Every strictly positive hinge contributes to training.
          if (hinge > epsilon) violations++;
          if (mode === 'triplet' && hinge > 0) {
            active++;
            loss += hinge;
            // Aggregate distance derivatives before applying their analytic
            // gradients. This computes every ordered (a, p, n) triplet while
            // evaluating each distance gradient only once per step.
            weights[Math.min(a, p) * count + Math.max(a, p)]++;
            weights[Math.min(a, n) * count + Math.max(a, n)]--;
          }
        }
      }
    }

    // Exactly batch-all: average over positive-loss triplets, not all valid
    // triplets. If none are active the gradient and loss are both zero.
    const denominator = mode === 'triplet' ? active || 1 : pairCount;
    for (let a = 0; a < count; a++) {
      for (let b = a + 1; b < count; b++) {
        const key = a * count + b;
        const factor = weights[key] / Math.max(distances[key], epsilon) / denominator;
        const dx = factor * (points[2 * a] - points[2 * b]);
        const dy = factor * (points[2 * a + 1] - points[2 * b + 1]);
        gradient[2 * a] += dx;
        gradient[2 * a + 1] += dy;
        gradient[2 * b] -= dx;
        gradient[2 * b + 1] -= dy;
      }
    }
    return { spread: spread / withinPairCount, violations, active, loss: loss / denominator };
  }

  const trajectories = {};
  for (const mode of ['contrastive', 'triplet']) {
    const states = [];
    let points = initial.slice();
    let stats = evaluate(points, mode);
    states.push({ points: points.slice(), ...stats });
    for (let step = 1; step <= steps; step++) {
      // Once every triplet is satisfied, plain gradient descent stops. Keep
      // storing that unchanged state so both timelines have the same length.
      if (mode !== 'triplet' || stats.active > 0) {
        for (let i = 0; i < points.length; i++) points[i] -= learningRate * gradient[i];
        stats = evaluate(points, mode);
      }
      states.push({ points: points.slice(), ...stats });
    }
    trajectories[mode] = states;
  }
  return { settings: SETTINGS, domain: DOMAIN, totalTriplets, ...trajectories };
}

// Run once per mount, after precomputing. Throwing is also useful to the Node
// fallback generator; mount catches failures and dispatches island:error.
export function assertSimulation(result) {
  const initialSpread = result.contrastive[0].spread;
  const contrastiveEnd = result.contrastive[SETTINGS.steps];
  const tripletEnd = result.triplet[SETTINGS.steps];
  if (!(contrastiveEnd.spread < 0.15 * initialSpread)) {
    throw new Error(`Contrastive spread ${contrastiveEnd.spread} must be below 15% of ${initialSpread}`);
  }
  if (tripletEnd.violations !== 0) {
    throw new Error(`Triplet training has ${tripletEnd.violations} unsatisfied triplets`);
  }
  if (!(tripletEnd.spread >= 0.5 * initialSpread)) {
    throw new Error(`Triplet spread ${tripletEnd.spread} must retain at least 50% of ${initialSpread}`);
  }
  // Additional invariants: preserve identities, finite coordinates, the common
  // starting state, and the fixed domain throughout both training timelines.
  for (const mode of ['contrastive', 'triplet']) {
    for (const state of result[mode]) {
      if (state.points.length !== 4 * SETTINGS.perClass) throw new Error('Point count changed');
      for (let i = 0; i < state.points.length; i++) {
        const value = state.points[i];
        const min = i % 2 ? DOMAIN.yMin : DOMAIN.xMin;
        const max = i % 2 ? DOMAIN.yMax : DOMAIN.xMax;
        if (!Number.isFinite(value) || value <= min || value >= max) throw new Error('Point outside the fixed domain');
      }
    }
  }
  if (!result.contrastive[0].points.every((v, i) => v === result.triplet[0].points[i])) {
    throw new Error('Losses must share their starting points');
  }
}

const NS = 'http://www.w3.org/2000/svg';
let instance = 0;

export function mount(node) {
  let simulation;
  try {
    simulation = simulate();
    assertSimulation(simulation);
  } catch (error) {
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
    console.error('Triplet Loss training:', error);
    return;
  }

  const sliderId = `triplet-training-step-${++instance}`;
  node.classList.add('tl-training');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Loss function">',
    '      <button type="button" class="qi-chip" data-loss="contrastive" aria-pressed="true">Contrastive Loss</button>',
    '      <button type="button" class="qi-chip" data-loss="triplet" aria-pressed="false">Triplet Loss</button>',
    '    </div>',
    '    <button type="button" class="qi-chip tl-training__play">Replay</button>',
    '    <div class="tl-training__timeline">',
    `      <label for="${sliderId}">Training step</label>`,
    `      <input id="${sliderId}" type="range" min="0" max="${SETTINGS.steps}" step="1" value="${SETTINGS.steps}">`,
    '    </div>',
    '  </div>',
    '  <div class="tl-training__legend">',
    '    <span><i class="tl-training__key tl-training__key--a" aria-hidden="true"></i>Class A (circles)</span>',
    '    <span><i class="tl-training__key tl-training__key--b" aria-hidden="true"></i>Class B (squares)</span>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 700 400" role="img">',
    '    <rect class="qi-frame" x="2" y="2" width="696" height="396" rx="6"/>',
    '    <g class="tl-training__points"></g>',
    '  </svg>',
    '  <p class="qi-status tl-training__status"></p>',
    '  <span class="tl-training__live" role="status" aria-live="polite" aria-atomic="true"></span>',
    '</div>',
  ].join('\n');

  const svg = node.querySelector('svg');
  const pointsGroup = node.querySelector('.tl-training__points');
  const chips = [...node.querySelectorAll('[data-loss]')];
  const play = node.querySelector('.tl-training__play');
  const slider = node.querySelector('input');
  const status = node.querySelector('.tl-training__status');
  const live = node.querySelector('.tl-training__live');
  const points = [];
  for (let i = 0; i < 2 * SETTINGS.perClass; i++) {
    const isA = i < SETTINGS.perClass;
    const shape = document.createElementNS(NS, isA ? 'circle' : 'rect');
    shape.setAttribute('class', `tl-training__point tl-training__point--${isA ? 'a' : 'b'}`);
    if (isA) shape.setAttribute('r', '5.5');
    else {
      shape.setAttribute('width', '10');
      shape.setAttribute('height', '10');
    }
    pointsGroup.appendChild(shape);
    points.push(shape);
  }

  let mode = 'contrastive';
  let step = SETTINGS.steps;
  let playing = false;
  let frame = 0;
  const duration = 6000;
  const name = () => mode === 'contrastive' ? 'Contrastive Loss' : 'Triplet Loss';

  function render() {
    const state = simulation[mode][step];
    points.forEach((shape, i) => {
      // Equal units on x and y: 672 / 7.7 == 384 / 4.4.
      const x = 14 + (state.points[2 * i] - DOMAIN.xMin) * 672 / (DOMAIN.xMax - DOMAIN.xMin);
      const y = 8 + (DOMAIN.yMax - state.points[2 * i + 1]) * 384 / (DOMAIN.yMax - DOMAIN.yMin);
      if (i < SETTINGS.perClass) {
        shape.setAttribute('cx', x);
        shape.setAttribute('cy', y);
      } else {
        shape.setAttribute('x', x - 5);
        shape.setAttribute('y', y - 5);
      }
    });
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.loss === mode)));
    play.textContent = playing ? 'Pause' : step === SETTINGS.steps ? 'Replay' : 'Play';
    slider.value = step;
    slider.setAttribute('aria-valuetext', `Step ${step} of ${SETTINGS.steps}`);
    status.innerHTML = `<span>Step <b>${step} of ${SETTINGS.steps}</b> · ${name()}</span>` +
      `<span>Spread within a class: <b>${state.spread.toFixed(2)}</b> (start ${simulation[mode][0].spread.toFixed(2)})</span>` +
      `<span>Triplets violating the margin: <b>${state.violations.toLocaleString('en-US')}</b> of ${simulation.totalTriplets.toLocaleString('en-US')}</span>`;
    svg.setAttribute('aria-label', `${name()}, step ${step} of ${SETTINGS.steps}. Class A uses circles; Class B uses squares. Mean within-class distance ${state.spread.toFixed(2)}. ${state.violations} of ${simulation.totalTriplets} triplets violate the margin.`);
  }

  function announce() {
    live.textContent = [...status.children].map((line) => line.textContent).join('. ');
  }

  function stop() {
    playing = false;
    cancelAnimationFrame(frame);
    frame = 0;
    // Clear Pause even when rendering failed or the mount was removed.
    play.textContent = step === SETTINGS.steps ? 'Replay' : 'Play';
  }

  function failPlayback(error) {
    stop();
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
    console.error('Triplet Loss training playback:', error);
  }

  play.addEventListener('click', () => {
    try {
      if (playing) {
        stop();
        render();
        announce();
        return;
      }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        step = SETTINGS.steps;
        render();
        announce();
        return;
      }
      if (step === SETTINGS.steps) step = 0;
      playing = true;
      const startTime = performance.now() - step * duration / SETTINGS.steps;
      render();
      function tick(time) {
        try {
          // The callback retains no page-global handlers and stops on removal.
          if (!node.isConnected) {
            stop();
            return;
          }
          // A frame's timestamp can precede the click's performance.now().
          // Clamp both bounds before using the step as a snapshot index.
          step = Math.max(0, Math.min(SETTINGS.steps,
            Math.floor((time - startTime) * SETTINGS.steps / duration)));
          if (step === SETTINGS.steps) {
            stop();
            render();
            announce();
          } else {
            render();
            frame = requestAnimationFrame(tick);
          }
        } catch (error) {
          failPlayback(error);
        }
      }
      frame = requestAnimationFrame(tick);
    } catch (error) {
      failPlayback(error);
    }
  });

  chips.forEach((chip) => chip.addEventListener('click', () => {
    mode = chip.dataset.loss;
    // Keep the current step, including during playback, for a fair comparison.
    render();
    announce();
  }));
  slider.addEventListener('input', () => {
    const wasPlaying = playing;
    stop();
    step = Math.max(0, Math.min(SETTINGS.steps, Number(slider.value)));
    render();
    if (wasPlaying) announce();
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
