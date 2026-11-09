/*
 * selector island: pick a quantization method for your collection.
 *
 * Every number the tool shows comes from the measurements in the vector
 * quantization guide, or from arithmetic on your inputs:
 *
 *   memory      arithmetic: vectors x dimensions x bits per dimension, plus the
 *               largest bookkeeping overhead the guide measured (12%)
 *   recall      rescoring.csv, hnsw_ef 256, oversampling 2, four workloads
 *               (Quora and FiQA, each with Cohere 1,024-d and BGE-small 384-d).
 *               Interpolated between the two models by dimension count and
 *               between the two corpora by sign imbalance
 *   p95, QPS    memory.csv and throughput.csv, Quora with both models, shown
 *               as a ratio to float32 HNSW. Only the five methods the guide
 *               measured have them
 *   choice      the "Choosing" rules: the least aggressive method that fits,
 *               with TurboQuant preferred for recall and binary for speed
 *
 * The model and the view are separate: estimate() and recommend() are pure and
 * exported for tests, mount() draws them.
 */

const OVERHEAD = 1.12;
const DOCS = '/documentation/manage-data/quantization/';

// Recall is stored per workload in this order.
const WORKLOADS = ['quora-cohere', 'quora-bge', 'fiqa-cohere', 'fiqa-bge'];
// Sign imbalance of each workload's embeddings (the guide's table).
const IMBALANCE = { cohere: [0.128, 0.164], bge: [0.132, 0.195] };

// bits: bits per dimension of the searched copy. recall: [off, on] per workload.
// p95 and qps: [Quora Cohere 1,024-d, Quora BGE 384-d], absolute, used as ratios.
const METHODS = [
  {
    id: 'f32', name: 'float32 HNSW', family: 'none', bits: 32, group: 0, plain: true,
    recall: { off: [0.994, 0.996, 0.996, 0.991], on: [0.994, 0.996, 0.996, 0.991] },
    p95: [2.1, 1.19], qps: [4187, 5768],
  },
  {
    id: 'sq', name: 'Scalar int8', family: 'scalar', bits: 8, group: 1,
    recall: { off: [0.981, 0.962, 0.981, 0.926], on: [0.993, 0.993, 0.996, 0.988] },
    p95: [0.96, 0.61], qps: [5567, 7262],
    settings: 'type: int8, quantile: 0.99, memory: pinned',
  },
  {
    id: 'tq4', name: 'TurboQuant 4-bit', family: 'turbo', bits: 4, group: 2,
    recall: { off: [0.972, 0.95, 0.96, 0.932], on: [0.994, 0.994, 0.996, 0.988] },
    p95: [0.69, 0.49], qps: [6138, 7708],
    settings: 'bits: bits4, memory: pinned',
  },
  {
    id: 'tq2', name: 'TurboQuant 2-bit', family: 'turbo', bits: 2, group: 3,
    recall: { off: [0.928, 0.868, 0.88, 0.789], on: [0.994, 0.985, 0.991, 0.958] },
    settings: 'bits: bits2, memory: pinned',
  },
  {
    id: 'bq2', name: 'Binary 2-bit', family: 'binary', bits: 2, group: 3,
    recall: { off: [0.835, 0.766, 0.705, 0.584], on: [0.974, 0.92, 0.888, 0.766] },
    settings: 'encoding: two_bits, memory: pinned',
  },
  {
    id: 'tq15', name: 'TurboQuant 1.5-bit', family: 'turbo', bits: 1.5, group: 4,
    recall: { off: [0.881, 0.809, 0.811, 0.653], on: [0.986, 0.963, 0.958, 0.84] },
    settings: 'bits: bits1_5, memory: pinned',
  },
  {
    id: 'tq1', name: 'TurboQuant 1-bit', family: 'turbo', bits: 1, group: 5,
    recall: { off: [0.863, 0.774, 0.782, 0.61], on: [0.98, 0.938, 0.947, 0.791] },
    settings: 'bits: bits1, memory: pinned',
  },
  {
    id: 'bq1', name: 'Binary 1-bit', family: 'binary', bits: 1, group: 5,
    recall: { off: [0.788, 0.675, 0.627, 0.42], on: [0.943, 0.838, 0.794, 0.56] },
    p95: [0.48, 0.46], qps: [6674, 7209],
    settings: 'memory: pinned',
  },
  {
    id: 'pq8', name: 'Product x8', family: 'product', bits: 4, group: 6,
    recall: { off: [0.955, 0.934, 0.951, 0.905], on: [0.991, 0.996, 0.997, 0.987] },
    p95: [2.32, 1.07], qps: [2720, 4794],
    settings: 'compression: x8, memory: pinned',
  },
  {
    id: 'pq16', name: 'Product x16', family: 'product', bits: 2, group: 6,
    recall: { off: [0.913, 0.83, 0.885, 0.731], on: [0.991, 0.973, 0.994, 0.905] },
    settings: 'compression: x16, memory: pinned',
  },
  {
    // The guide measured x8 and x16 only. x64 is here because the guide
    // recommends product quantization at 64x, with its recall unmeasured.
    id: 'pq64', name: 'Product x64', family: 'product', bits: 0.5, group: 6,
    recall: null,
    settings: 'compression: x64, memory: pinned',
  },
];

// turbo4 storage: originals stored at 4 bits, no search copy (datatype.csv).
const TURBO4 = {
  id: 'turbo4', name: 'turbo4 storage', family: 'storage',
  recall: [0.969, 0.946, 0.959, 0.902],
};

const REF = METHODS[0];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const lerp = (x, x0, x1, v0, v1) => v0 + ((v1 - v0) * (x - x0)) / (x1 - x0);

// 0 at 384 dimensions (the BGE-small workloads), 1 at 1,024 (Cohere).
function dimWeight(dims) {
  return clamp(Math.log(dims / 384) / Math.log(1024 / 384), 0, 1);
}

function blend(pair, dims) {
  // pair = [value at 1,024-d, value at 384-d]
  const w = dimWeight(dims);
  return pair[1] + w * (pair[0] - pair[1]);
}

function recallEstimate(recall, dims, imbalance) {
  const w = dimWeight(dims);
  const [c0, c1] = IMBALANCE.cohere;
  const [b0, b1] = IMBALANCE.bge;
  const cohere = lerp(imbalance, c0, c1, recall[0], recall[2]);
  const bge = lerp(imbalance, b0, b1, recall[1], recall[3]);
  const outside = (x, lo, hi) => x < lo - 0.004 || x > hi + 0.004;
  const extrapolated = (w > 0 && outside(imbalance, c0, c1)) || (w < 1 && outside(imbalance, b0, b1));
  return {
    value: clamp(bge + w * (cohere - bge), 0, 1),
    extrapolated,
    dimsOutside: dims < 384 || dims > 1024,
  };
}

function ratios(m, dims) {
  const out = { p95: null, qps: null };
  if (m.p95) out.p95 = blend([m.p95[0] / REF.p95[0], m.p95[1] / REF.p95[1]], dims);
  if (m.qps) out.qps = blend([m.qps[0] / REF.qps[0], m.qps[1] / REF.qps[1]], dims);
  return out;
}

/** Everything the table shows for one method, before any constraint is applied. */
export function estimate(m, input) {
  const { vectors, dims, imbalance, rescore } = input;
  const originals = vectors * dims * 4;
  const copy = (vectors * dims * m.bits) / 8;
  const ram = m.plain ? copy : copy * OVERHEAD;
  const r = m.recall ? recallEstimate(rescore ? m.recall.on : m.recall.off, dims, imbalance) : null;
  const rOff = m.recall ? recallEstimate(m.recall.off, dims, imbalance).value : null;
  const rOn = m.recall ? recallEstimate(m.recall.on, dims, imbalance).value : null;
  return {
    method: m,
    originals,
    ram,
    shrink: originals / copy,
    recall: r ? r.value : null,
    recallOff: rOff,
    recallOn: rOn,
    extrapolated: r ? r.extrapolated : false,
    dimsOutside: r ? r.dimsOutside : false,
    ...ratios(m, dims),
  };
}

function verdict(e, input) {
  const m = e.method;
  const manhattan = input.metric === 'manhattan';
  if (manhattan && m.family === 'turbo') return { ok: false, tag: 'slow', text: 'Manhattan takes a slow path' };
  if (manhattan && m.family === 'binary') return { ok: false, tag: 'metric', text: 'Not covered for Manhattan here' };
  if (input.priority === 'speed' && m.family === 'product') return { ok: false, tag: 'slow', text: 'Slowest at matched recall' };
  if (e.ram > input.ramBytes) return { ok: false, tag: 'ram', text: `Needs ${fmtBytes(e.ram)}` };
  if (e.recall == null) return { ok: false, tag: 'unknown', text: 'Recall not measured' };
  if (e.recall < input.target) return { ok: false, tag: 'recall', text: `Recall ${fmtR(e.recall)} misses` };
  return { ok: true, tag: 'ok', text: 'Meets every constraint' };
}

const ORDER = [['f32'], ['sq'], ['tq4'], ['tq2', 'bq2'], ['tq15'], ['tq1', 'bq1'], ['pq8', 'pq16', 'pq64']];

/**
 * Recall priority: the least aggressive method that fits and meets the target,
 * so the margin is as wide as the budget allows. Within a compression level
 * TurboQuant wins on recall. Product quantization is the last resort.
 *
 * Speed priority: the fastest measured method that fits and meets the target.
 * Methods without a measured p95 only come into play when none of the measured
 * ones qualify, and binary goes first at each level there.
 */
export function recommend(input) {
  const rows = METHODS.map((m) => {
    const e = estimate(m, input);
    return { ...e, verdict: verdict(e, input) };
  });
  const byId = Object.fromEntries(rows.map((r) => [r.method.id, r]));
  const speed = input.priority === 'speed';

  let pick = null;
  if (speed) {
    const fast = rows.filter((r) => r.verdict.ok && r.p95 != null && r.method.id !== 'f32');
    if (fast.length) pick = fast.reduce((a, b) => (a.p95 <= b.p95 ? a : b));
  }
  for (const group of pick ? [] : ORDER) {
    if (speed && group[0] === 'f32') continue;
    const ids = group.slice();
    if (speed) ids.sort((a, b) => (byId[b].method.family === 'binary') - (byId[a].method.family === 'binary'));
    const hit = ids.map((id) => byId[id]).find((r) => r.verdict.ok);
    if (hit) { pick = hit; break; }
  }
  // Beyond 32x only product quantization is left. The guide did not measure
  // its recall at x64, so it is offered, with that warning, only when memory is
  // the reason nothing else works. A method that fits but misses the recall
  // target is a different problem, and x64 would not solve it.
  const measuredFits = rows.some((r) => r.recall != null && r.ram <= input.ramBytes
    && r.method.id !== 'f32' && r.verdict.tag !== 'slow' && r.verdict.tag !== 'metric');
  if (!pick && !speed && !measuredFits && byId.pq64.ram <= input.ramBytes) pick = byId.pq64;

  let storage = null;
  if (input.disk) {
    const r = recallEstimate(TURBO4.recall, input.dims, input.imbalance);
    storage = {
      method: TURBO4,
      originals: input.vectors * input.dims * 4,
      disk: (input.vectors * input.dims * 4) / 8,
      recall: r.value,
      extrapolated: r.extrapolated,
      meets: r.value >= input.target,
    };
  }

  let diagnosis = null;
  if (!pick) {
    const usable = rows.filter((r) => r.method.id !== 'f32'
      && !(input.metric === 'manhattan' && r.method.family !== 'scalar' && r.method.family !== 'product')
      && !(speed && r.method.family === 'product'));
    const measured = usable.filter((r) => r.recall != null);
    const meeting = measured.filter((r) => r.recall >= input.target);
    const fitting = measured.filter((r) => r.ram <= input.ramBytes);
    diagnosis = {
      needRam: meeting.length ? meeting.reduce((a, b) => (a.ram <= b.ram ? a : b)) : null,
      bestFit: fitting.length ? fitting.reduce((a, b) => (a.recall >= b.recall ? a : b)) : null,
      smallest: usable.reduce((a, b) => (a.ram <= b.ram ? a : b)),
    };
  }

  return { rows, pick, storage, diagnosis };
}

export function fmtBytes(b) {
  const gb = b / 1e9;
  if (gb >= 1000) return `${(gb / 1000).toFixed(gb >= 10000 ? 0 : 1)} TB`;
  if (gb >= 100) return `${gb.toFixed(0)} GB`;
  if (gb >= 10) return `${gb.toFixed(1)} GB`;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = b / 1e6;
  return `${mb >= 100 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}

// Truncate, never round up: 0.995 is shown as 0.99, not 1.00.
export const fmtR = (x) => (Math.floor(x * 100 + 1e-9) / 100).toFixed(2);

export function fmtCount(n) {
  if (n >= 1e9) return `${n / 1e9}B`;
  if (n >= 1e6) return `${n / 1e6}M`;
  return `${n / 1e3}k`;
}

const fmtX = (x) => (x >= 10 ? x.toFixed(0) : x.toFixed(x >= 1 ? 1 : 2)).replace(/\.0$/, '') + '×';
const fmtShrink = (x) => `${String(Math.round(x * 10) / 10)}×`;

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

const STOPS = {
  vectors: [1e5, 2e5, 5e5, 1e6, 2e6, 5e6, 1e7, 2e7, 5e7, 1e8, 2e8, 5e8, 1e9],
  dims: [256, 384, 512, 768, 1024, 1536, 2048, 3072],
  ramGb: [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048],
};

const DEFAULTS = { vectors: 6, dims: 4, ram: 4, target: 0.95, imbalance: 0.15 };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function why(pick, input) {
  const m = pick.method;
  const off = pick.recallOff != null ? fmtR(pick.recallOff) : null;
  const keep = `Keep rescoring on: without it recall falls to about ${off}.`;
  if (input.priority === 'speed' && pick.p95 != null && m.id !== 'f32') {
    const centered = m.family === 'binary' ? ' Binary is the most sensitive to how centered your embeddings are, so measure yours first.' : '';
    return `The fastest measured method that fits and meets your target, at ${fmtX(pick.p95)} the p95 of float32 HNSW.${pick.method.bits <= 2 ? ` ${keep}` : ''}${centered}`;
  }
  switch (m.id) {
    case 'f32':
      return `Your ${fmtBytes(pick.originals)} of float32 vectors fit in ${fmtBytes(input.ramBytes)}, so memory does not force a choice. A quantized copy would still roughly halve p95 in the guide's runs, so switch the priority to Speed if latency matters.`;
    case 'sq':
      return input.metric === 'manhattan'
        ? 'Scalar is the method to use with Manhattan distance, and 4× is enough for your budget.'
        : '4× is enough for your budget, and scalar makes no assumptions about your embeddings. If you do not need Manhattan distance, 4-bit TurboQuant gives similar recall at half the memory.';
    case 'tq4':
      return '8× is the least compression that fits. In the guide, 4-bit TurboQuant matched scalar recall at half the memory and ran slightly faster.';
    case 'tq2':
      return `16× is the least compression that fits. TurboQuant keeps more recall than binary at this size. ${keep}`;
    case 'bq2':
      return `16× is the least compression that fits, and binary is the faster choice at this size. ${keep}`;
    case 'tq15':
      return `About 21× is the least compression that fits. ${keep}`;
    case 'tq1':
      return `32× is the least compression that fits. In the guide's four rescored workloads 1-bit TurboQuant reached 0.79 to 0.98 recall, against 0.56 to 0.94 for binary. ${keep}`;
    case 'bq1':
      return `32× is the least compression that fits. Binary was the fastest method wherever it met the target, and it is the most sensitive to how centered your embeddings are. ${keep}`;
    default:
      return m.id === 'pq64'
        ? 'Nothing measured reaches your memory budget, so this is the largest ratio Qdrant offers. The guide did not measure x64 recall, so test it on your data before relying on it.'
        : 'Product quantization is the last resort: it searches slowest at matched recall. Choose it only when memory is the single constraint.';
  }
}

function noPick(rec, input) {
  const d = rec.diagnosis;
  const lines = [];
  if (d.needRam) {
    lines.push(`${d.needRam.method.name} reaches the recall target but needs ${fmtBytes(d.needRam.ram)}. Raise the RAM budget to that, or cut the dimension count first with a Matryoshka model.`);
  } else {
    lines.push(`No measured method reaches recall ${input.target.toFixed(3).replace(/0$/, '')} at this embedding centering with rescoring ${input.rescore ? 'on' : 'off'}.`);
    if (!input.rescore) lines.push('Turn rescoring on, or lower the target.');
  }
  if (d.bestFit) {
    lines.push(`Within your budget the closest is ${d.bestFit.method.name} at recall ${fmtR(d.bestFit.recall)}.`);
  } else {
    lines.push(`Even the smallest copy, ${d.smallest.method.name}, needs ${fmtBytes(d.smallest.ram)}.`);
  }
  return lines;
}

export function mount(node) {
  node.classList.add('qsel');
  const uid = `qsel-${Math.random().toString(36).slice(2, 8)}`;

  const field = (key, label, hint) => `
    <div class="qs-field">
      <div class="qs-field__head">
        <label for="${uid}-${key}">${label}</label>
        <output id="${uid}-${key}-out" for="${uid}-${key}"></output>
      </div>
      <input id="${uid}-${key}" data-key="${key}" type="range">
      ${hint ? `<p class="qs-hint">${hint}</p>` : ''}
    </div>`;

  node.innerHTML = `
    <div class="qi-fig qs-fig">
      <div class="qs-controls">
        ${field('vectors', 'Vectors', 'Points in the collection.')}
        ${field('dims', 'Dimensions', 'Recall is measured at 384 and 1,024 and interpolated in between.')}
        ${field('ram', 'RAM for the quantized copy', 'Leave room for the HNSW graph and payload indexes. They are not counted here.')}
        ${field('target', 'Recall@10 target', 'Overlap with exact float32 search.')}
        ${field('imbalance', 'Sign imbalance', 'Average distance between each coordinate\'s share of positive values and one half. Quora text sits near 0.13, FiQA and SciFact between 0.16 and 0.21.')}
      </div>
      <div class="qi-controls qs-chips">
        <div class="qi-group" role="group" aria-label="Priority">
          <span class="qi-hint">Priority</span>
          <button type="button" class="qi-chip" data-set="priority" data-value="recall" aria-pressed="true">Recall</button>
          <button type="button" class="qi-chip" data-set="priority" data-value="speed" aria-pressed="false">Speed</button>
        </div>
        <div class="qi-group" role="group" aria-label="Distance metric">
          <span class="qi-hint">Distance</span>
          <button type="button" class="qi-chip" data-set="metric" data-value="cosine" aria-pressed="true">Cosine, dot, L2</button>
          <button type="button" class="qi-chip" data-set="metric" data-value="manhattan" aria-pressed="false">Manhattan</button>
        </div>
        <div class="qi-group" role="group" aria-label="Options">
          <button type="button" class="qi-chip" data-toggle="rescore" aria-pressed="true"><span class="qi-switch__track"><span class="qi-switch__knob"></span></span>Rescoring</button>
          <button type="button" class="qi-chip" data-toggle="disk" aria-pressed="false"><span class="qi-switch__track"><span class="qi-switch__knob"></span></span>Disk is the constraint</button>
        </div>
      </div>
      <div class="qs-result" role="status" aria-live="polite"></div>
      <div class="qs-tiles"></div>
      <div class="qs-table-wrap"></div>
      <p class="qs-foot"></p>
    </div>`;

  const q = (s) => node.querySelector(s);
  const inputs = {};
  node.querySelectorAll('input[type="range"]').forEach((el) => { inputs[el.dataset.key] = el; });

  const state = {
    vectors: STOPS.vectors[DEFAULTS.vectors], dims: STOPS.dims[DEFAULTS.dims], ramIdx: DEFAULTS.ram,
    target: DEFAULTS.target, imbalance: DEFAULTS.imbalance,
    priority: 'recall', metric: 'cosine', rescore: true, disk: false, picked: null,
  };
  const set = (el, min, max, step, value) => { el.min = min; el.max = max; el.step = step; el.value = value; };
  set(inputs.vectors, 0, STOPS.vectors.length - 1, 1, DEFAULTS.vectors);
  set(inputs.dims, 0, STOPS.dims.length - 1, 1, DEFAULTS.dims);
  set(inputs.ram, 0, STOPS.ramGb.length - 1, 1, DEFAULTS.ram);
  set(inputs.target, 0.9, 0.99, 0.005, DEFAULTS.target);
  set(inputs.imbalance, 0.12, 0.2, 0.005, DEFAULTS.imbalance);

  function read() {
    state.vectors = STOPS.vectors[+inputs.vectors.value];
    state.dims = STOPS.dims[+inputs.dims.value];
    state.ramIdx = +inputs.ram.value;
    state.target = +inputs.target.value;
    state.imbalance = +inputs.imbalance.value;
  }

  const ramGb = () => STOPS.ramGb[state.ramIdx];
  const labels = () => ({
    vectors: fmtCount(state.vectors),
    dims: String(state.dims),
    ram: ramGb() >= 1024 ? `${ramGb() / 1024} TB` : `${ramGb()} GB`,
    target: state.target.toFixed(3).replace(/0$/, ''),
    imbalance: state.imbalance.toFixed(3).replace(/0$/, ''),
  });

  function input() {
    return {
      vectors: state.vectors, dims: state.dims, imbalance: state.imbalance, target: state.target,
      ramBytes: ramGb() * 1e9, priority: state.priority, metric: state.metric,
      rescore: state.rescore, disk: state.disk,
    };
  }

  function tile(label, big, sub) {
    return `<div class="qs-tile"><span class="qs-tile__label">${label}</span><strong class="qs-tile__big">${big}</strong><span class="qs-tile__sub">${sub}</span></div>`;
  }

  function render() {
    read();
    const inp = input();
    const rec = recommend(inp);
    const lab = labels();
    for (const k of Object.keys(lab)) q(`#${uid}-${k}-out`).textContent = lab[k];
    inputs.vectors.setAttribute('aria-valuetext', `${lab.vectors} vectors`);
    inputs.dims.setAttribute('aria-valuetext', `${lab.dims} dimensions`);
    inputs.ram.setAttribute('aria-valuetext', `${lab.ram} of RAM`);

    node.querySelectorAll('[data-set]').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.set] === b.dataset.value)));
    node.querySelectorAll('[data-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.toggle])));

    // Result card
    const result = q('.qs-result');
    const extrap = rec.pick ? rec.pick.extrapolated : rec.rows.some((r) => r.extrapolated);
    const dimsOut = state.dims < 384 || state.dims > 1024;
    let html = '';
    if (rec.storage && rec.storage.meets) {
      html = `<p class="qs-result__kicker">Recommended for a disk constraint</p>
        <h3 class="qs-result__name">turbo4 storage</h3>
        <p class="qs-result__why">The originals shrink 8× to ${fmtBytes(rec.storage.disk)} on disk, with recall around ${fmtR(rec.storage.recall)} rescored. That loss is permanent and cannot be undone without re-ingesting. If RAM is also tight, pair it with a pinned search copy.</p>
        <p class="qs-settings"><code>datatype: turbo4</code> <a href="${DOCS}">Quantization docs</a></p>`;
    } else if (rec.pick) {
      const m = rec.pick.method;
      const note = rec.storage ? `<p class="qs-note">turbo4 storage would reach only about ${fmtR(rec.storage.recall)} here, below your target, so the recommendation below keeps float32 originals.</p>` : '';
      const anchor = { scalar: '#setting-up-scalar-quantization', turbo: '#setting-up-turboquant', binary: '#setting-up-binary-quantization', product: '#setting-up-product-quantization' }[m.family];
      html = `<p class="qs-result__kicker">Recommended</p>
        <h3 class="qs-result__name">${m.id === 'f32' ? 'No quantization needed' : esc(m.name)}</h3>
        <p class="qs-result__why">${esc(why(rec.pick, inp))}</p>
        ${m.settings ? `<p class="qs-settings"><code>${esc(m.settings)}</code>${state.rescore ? ' <code>rescore: true, oversampling: 2</code>' : ''} <a href="${DOCS}${anchor}">Setup docs</a></p>` : ''}
        ${note}`;
    } else {
      html = `<p class="qs-result__kicker qs-result__kicker--warn">No measured method meets every constraint</p>
        ${noPick(rec, inp).map((l) => `<p class="qs-result__why">${esc(l)}</p>`).join('')}`;
    }
    if (rec.pick && rec.pick.method.family === 'binary' && state.imbalance > 0.19) {
      html += '<p class="qs-note">Past a sign imbalance of about 0.19, binary 1-bit did not reach 0.95 anywhere in the guide\'s grid. Measure yours before you rely on it.</p>';
    }
    if (extrap || dimsOut) {
      html += `<p class="qs-note">${dimsOut ? 'The guide measured 384 and 1,024 dimensions, so recall here is extrapolated. ' : ''}${extrap ? 'This sign imbalance is outside the range measured for these dimensions, so recall is extrapolated. ' : ''}Treat it as a prompt to measure, not a result.</p>`;
    }
    result.innerHTML = html;

    // Tiles for the selected method (the recommendation unless a row was picked)
    const storageWins = Boolean(rec.storage && rec.storage.meets);
    const lead = storageWins ? 'turbo4' : rec.pick && rec.pick.method.id;
    const shown = rec.rows.find((r) => r.method.id === (state.picked || lead)) || (storageWins ? null : rec.rows[0]);
    const base = rec.rows[0];
    const isRef = shown && shown.method.id === 'f32';
    const tiles = !shown ? [
      tile('Memory', '8× smaller', `${fmtBytes(rec.storage.originals)} to ${fmtBytes(rec.storage.disk)} of stored vectors`),
      tile('Recall@10', fmtR(rec.storage.recall), `float32 HNSW is ${fmtR(base.recall)}. Rescored against 4-bit originals.`),
      tile('Latency', 'n/m', 'Not measured in the guide'),
      tile('Throughput', 'n/m', 'Not measured in the guide'),
    ] : [
      tile('Memory', isRef ? '1×' : `${fmtShrink(shown.shrink)} smaller`, isRef ? `${fmtBytes(shown.ram)} resident` : `${fmtBytes(base.ram)} to ${fmtBytes(shown.ram)} in RAM. Originals stay cold on disk.`),
      tile('Recall@10', shown.recall == null ? 'n/m' : fmtR(shown.recall),
        shown.recall == null ? 'Not measured in the guide' : isRef ? 'Exact search is 1.00' : `float32 HNSW is ${fmtR(base.recall)}. Rescoring on ${fmtR(shown.recallOn)}, off ${fmtR(shown.recallOff)}.`),
      tile('Latency', shown.p95 == null ? 'n/m' : isRef ? '1×' : fmtX(shown.p95), shown.p95 == null ? 'Not measured in the guide' : 'p95 against float32 HNSW, measured at 523k vectors'),
      tile('Throughput', shown.qps == null ? 'n/m' : isRef ? '1×' : fmtX(shown.qps), shown.qps == null ? 'Not measured in the guide' : 'Queries per second against float32 HNSW, 8 clients'),
    ];
    q('.qs-tiles').innerHTML = `<p class="qs-tiles__title">Impact of <strong>${shown ? esc(shown.method.name) : 'turbo4 storage'}</strong>${state.picked ? ' <button type="button" class="qs-link" data-follow>Show the recommendation</button>' : ''}</p><div class="qs-tiles__grid">${tiles.join('')}</div>`;

    // Table
    const best = !storageWins && rec.pick ? rec.pick.method.id : null;
    const rowsHtml = rec.rows.map((r) => {
      const m = r.method;
      const memPct = clamp((r.ram / base.ram) * 100, 1.5, 100);
      const recPct = r.recall == null ? 0 : clamp((r.recall - 0.5) * 200, 0, 100);
      const tick = clamp((state.target - 0.5) * 200, 0, 100);
      const cls = ['qs-row'];
      if (m.id === best) cls.push('is-best');
      if (m.id === (state.picked || best)) cls.push('is-shown');
      if (!r.verdict.ok) cls.push('is-out');
      const cell = (label, inner) => `<td data-label="${label}">${inner}</td>`;
      return `<tr class="${cls.join(' ')}">
        <th scope="row"><button type="button" class="qs-pick" data-pick="${m.id}" aria-pressed="${m.id === (state.picked || best)}">${esc(m.name)}</button></th>
        ${cell('Copy in RAM', `<span class="qs-num">${fmtBytes(r.ram)}</span><span class="qs-bar"><i style="width:${memPct}%"></i></span>`)}
        ${cell('Recall@10', r.recall == null ? '<span class="qs-num qs-na">n/m</span>' : `<span class="qs-num">${fmtR(r.recall)}</span><span class="qs-bar qs-bar--recall"><i style="width:${recPct}%"></i><b style="left:${tick}%"></b></span>`)}
        ${cell('p95', r.p95 == null ? '<span class="qs-num qs-na">n/m</span>' : `<span class="qs-num">${m.id === 'f32' ? '1×' : fmtX(r.p95)}</span>`)}
        ${cell('QPS', r.qps == null ? '<span class="qs-num qs-na">n/m</span>' : `<span class="qs-num">${m.id === 'f32' ? '1×' : fmtX(r.qps)}</span>`)}
        ${cell('Verdict', `<span class="qs-verdict qs-verdict--${m.id === best ? 'best' : r.verdict.tag}">${m.id === best ? 'Recommended' : esc(r.verdict.text)}</span>`)}
      </tr>`;
    });
    if (rec.storage) {
      const s = rec.storage;
      rowsHtml.push(`<tr class="qs-row${s.meets ? ' is-best' : ' is-out'}${storageWins && !state.picked ? ' is-shown' : ''}">
        <th scope="row"><span class="qs-pick qs-pick--static">${s.method.name}</span></th>
        <td data-label="Copy in RAM"><span class="qs-num qs-na">no copy</span></td>
        <td data-label="Recall@10"><span class="qs-num">${fmtR(s.recall)}</span></td>
        <td data-label="p95"><span class="qs-num qs-na">n/m</span></td>
        <td data-label="QPS"><span class="qs-num qs-na">n/m</span></td>
        <td data-label="Verdict"><span class="qs-verdict qs-verdict--${storageWins ? 'best' : s.meets ? 'ok' : 'recall'}">${storageWins ? 'Recommended: ' : ''}${fmtBytes(s.disk)} on disk${s.meets ? '' : ', misses target'}</span></td>
      </tr>`);
    }
    q('.qs-table-wrap').innerHTML = `<table class="qs-table">
      <caption class="qs-sr">Every method at your settings. Memory is arithmetic. Recall, p95, and throughput are estimated from the guide's measurements. n/m means not measured.</caption>
      <thead><tr><th scope="col">Method</th><th scope="col">Copy in RAM</th><th scope="col">Recall@10</th><th scope="col">p95 vs float32</th><th scope="col">QPS vs float32</th><th scope="col">Verdict</th></tr></thead>
      <tbody>${rowsHtml.join('')}</tbody></table>`;

    q('.qs-foot').textContent = `Memory is arithmetic with ${Math.round((OVERHEAD - 1) * 100)}% added for bookkeeping. Recall assumes hnsw_ef 256 and oversampling 2. Latency and throughput were measured on Quora with an 8-vCPU VM, so read them as ratios, not capacity numbers. n/m means the guide did not measure it.`;
  }

  node.addEventListener('input', (e) => { if (e.target.matches('input[type="range"]')) render(); });
  node.addEventListener('click', (e) => {
    const t = e.target.closest('[data-set],[data-toggle],[data-pick],[data-follow]');
    if (!t) return;
    if (t.dataset.set) state[t.dataset.set] = t.dataset.value;
    else if (t.dataset.toggle) state[t.dataset.toggle] = !state[t.dataset.toggle];
    else if (t.dataset.pick) state.picked = t.dataset.pick;
    else if (t.dataset.follow !== undefined) state.picked = null;
    render();
  });

  const narrowAt = 640;
  const watch = () => node.classList.toggle('qs-narrow', node.getBoundingClientRect().width < narrowAt);
  watch();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(watch).observe(node);

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
