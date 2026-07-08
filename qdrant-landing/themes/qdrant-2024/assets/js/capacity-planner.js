// Qdrant Capacity Planner
// Estimates RAM, disk storage and CPU for a Qdrant deployment.
// Formulas are based on Qdrant internals documented at
// https://qdrant.tech/documentation/tutorials-operations/large-scale-search/

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('capacity-planner');
  if (!form) return;

  const GiB = 1024 * 1024 * 1024;
  const LINK_BYTES = 4; // each HNSW connection is a 4-byte integer
  const STORAGE_OVERHEAD = 1.5; // segment copies, WAL, optimization headroom
  const RAM_HEADROOM = 1.2; // leave ~15-20% headroom on top of resident data
  const RAM_BASE_GIB = 0.5; // baseline process/system footprint

  // Per-point cost of the IdTracker (id <-> internal id + version mapping).
  const ID_OVERHEAD = {
    integer: 24, // version(4) + internal_to_external(8) + external_to_internal(12)
    uuid: 40, // version(4) + internal_to_external(16) + external_to_internal(20)
  };

  // Rough per-point cost of a single payload index (keyword/integer field).
  const PAYLOAD_INDEX_BYTES_PER_FIELD = 16;

  // Qualitative effects of each quantization mode (memory factor is computed live).
  const QUANT_INFO = {
    none: {
      name: 'No quantization',
      recall: 'Exact scoring — no recall loss.',
      speed: 'Baseline. Highest memory bandwidth per query.',
      best: 'Small collections, or when full precision is required.',
    },
    scalar: {
      name: 'Scalar (int8) quantization',
      recall: 'Minimal loss — typically ~99% recall retained.',
      speed: 'Faster: ~4× less data to scan, optional rescoring.',
      best: 'A safe general-purpose default for most embeddings.',
    },
    binary: {
      name: 'Binary quantization',
      recall: 'Larger loss on its own — recover with oversampling + rescoring.',
      speed: 'Fastest: Hamming distance on bit-packed vectors.',
      best: 'High-dimensional (≥1024d) normalized embeddings (OpenAI, Cohere, etc.).',
    },
    product: {
      name: 'Product quantization',
      recall: 'Highest loss — always rescore with the original vectors.',
      speed: 'Fast and very memory-efficient; rescoring adds disk reads.',
      best: 'Maximum compression when RAM is the primary constraint.',
    },
  };

  const el = (id) => document.getElementById(id);
  const num = (id, fallback = 0) => {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) && v >= 0 ? v : fallback;
  };
  const radio = (name) => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : null;
  };

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i += 1;
    }
    const decimals = value >= 100 || i <= 1 ? 0 : value >= 10 ? 1 : 2;
    return `${value.toFixed(decimals)} ${units[i]}`;
  }

  function readInputs() {
    return {
      vectors: num('cp-vectors'),
      dims: num('cp-dimensions', 1),
      vectorsPerPoint: Math.max(1, num('cp-vectors-per-point', 1)),
      datatypeBytes: parseFloat(radio('cp-datatype')) || 4,
      vectorsOnDisk: el('cp-vectors-on-disk').checked,
      quantization: radio('cp-quantization') || 'none',
      pqRatio: parseFloat(el('cp-pq-ratio').value) || 16,
      quantInRam: el('cp-quant-ram').checked,
      hnswM: num('cp-hnsw-m', 16),
      hnswOnDisk: el('cp-hnsw-on-disk').checked,
      tenantIndex: el('cp-tenant-index').checked,
      payloadM: num('cp-payload-m', 16),
      sparse: el('cp-sparse').checked,
      sparseNnz: Math.max(1, num('cp-sparse-nnz', 100)),
      sparseOnDisk: el('cp-sparse-on-disk').checked,
      fusion: radio('cp-fusion') || 'rrf',
      payloadBytes: num('cp-payload') * (parseFloat(el('cp-payload-unit').value) || 1),
      payloadInRam: !el('cp-payload-on-disk').checked,
      payloadIndexFields: Math.round(num('cp-payload-index-fields')),
      idType: radio('cp-id-type') || 'integer',
      replicas: Math.max(1, Math.round(num('cp-replicas', 1))),
      shards: Math.max(1, Math.round(num('cp-shards', 1))),
      walMb: parseFloat(el('cp-wal-capacity').value) || 32,
      qps: num('cp-qps'),
    };
  }

  function estimate(cfg) {
    const n = cfg.vectors;
    const vectorCount = n * cfg.vectorsPerPoint;

    // Raw (full-precision) vectors — always persisted on disk.
    const rawVectors = vectorCount * cfg.dims * cfg.datatypeBytes;

    // Quantized vectors (a compressed copy alongside the originals).
    let quantized = 0;
    if (cfg.quantization === 'scalar') {
      quantized = vectorCount * cfg.dims * 1; // int8: 1 byte / dimension
    } else if (cfg.quantization === 'binary') {
      quantized = vectorCount * cfg.dims * 0.125; // 1 bit / dimension
    } else if (cfg.quantization === 'product') {
      quantized = (vectorCount * cfg.dims * 4) / cfg.pqRatio; // relative to float32
    }
    const hasQuant = cfg.quantization !== 'none';

    // HNSW graph: level 0 has 2*m links, each a 4-byte integer.
    const hnsw = vectorCount * cfg.hnswM * 2 * LINK_BYTES;

    // Tenant payload index (payload_m): extra in-graph links for filtered search.
    const tenantLinks = cfg.tenantIndex ? n * cfg.payloadM * 2 * LINK_BYTES : 0;

    // Sparse vectors: each non-zero element is stored in the vector (u32 idx + f32
    // value = 8 B) and once more in the inverted index (u32 id + f32 weight = 8 B).
    const sparse = cfg.sparse ? n * cfg.sparseNnz * 16 : 0;

    // IdTracker: ids + versions, always in RAM.
    const idTracker = n * ID_OVERHEAD[cfg.idType];

    // Payload data.
    const payload = n * cfg.payloadBytes;

    // Payload indexes (always in RAM, used for filtering).
    const payloadIndex = n * cfg.payloadIndexFields * PAYLOAD_INDEX_BYTES_PER_FIELD;

    // Write-ahead log: reserved on disk per shard, per replica.
    const wal = cfg.walMb * 1024 * 1024 * cfg.shards;

    // ----- RAM (resident data that must fit in memory) -----
    const ramRawVectors = cfg.vectorsOnDisk ? 0 : rawVectors;
    const ramQuantized = hasQuant && cfg.quantInRam ? quantized : 0;
    const ramHnsw = cfg.hnswOnDisk ? 0 : hnsw;
    const ramTenant = cfg.hnswOnDisk ? 0 : tenantLinks; // shares HNSW storage location
    const ramSparse = cfg.sparseOnDisk ? 0 : sparse;
    const ramPayload = cfg.payloadInRam ? payload : 0;
    const ramData =
      ramRawVectors + ramQuantized + ramHnsw + ramTenant + ramSparse + idTracker + ramPayload + payloadIndex;
    const ramRecommended = ramData * RAM_HEADROOM + RAM_BASE_GIB * GiB;

    // ----- Disk (everything is persisted) -----
    const diskData =
      (rawVectors + quantized + hnsw + tenantLinks + sparse + idTracker + payload) * STORAGE_OVERHEAD + wal;

    // ----- CPU (rough guideline) -----
    const ramGiB = ramData / GiB;
    const cpuFromRam = ramGiB * 0.25; // ~1 vCPU per 4 GB of resident data
    const cpuFromQps = cfg.qps > 0 ? cfg.qps / 250 : 0; // ~250 simple queries/sec per core
    const cpuPerReplica = Math.max(2, Math.ceil(Math.max(cpuFromRam, cpuFromQps)));

    const r = cfg.replicas;

    return {
      replicas: r,
      ramRecommended: ramRecommended * r,
      diskData: diskData * r,
      cpu: cpuPerReplica * r,
      // Raw components (single copy) used for effect notes & advisories.
      parts: {
        hasQuant,
        rawVectors,
        quantized,
        hnsw,
        tenantLinks,
        sparse,
        wal,
        ramRawVectors,
        ramQuantized,
        ramHnsw,
        ramSparse,
      },
      breakdown: [
        { name: 'Original vectors', ram: ramRawVectors * r, disk: rawVectors * STORAGE_OVERHEAD * r },
        {
          name: hasQuant ? 'Quantized vectors' : 'Quantized vectors (off)',
          ram: ramQuantized * r,
          disk: quantized * STORAGE_OVERHEAD * r,
          muted: !hasQuant,
        },
        { name: 'HNSW index', ram: ramHnsw * r, disk: hnsw * STORAGE_OVERHEAD * r },
        {
          name: cfg.tenantIndex ? 'Tenant links (payload_m)' : 'Tenant links (off)',
          ram: ramTenant * r,
          disk: tenantLinks * STORAGE_OVERHEAD * r,
          muted: !cfg.tenantIndex,
        },
        {
          name: cfg.sparse ? 'Sparse vectors + index' : 'Sparse vectors (off)',
          ram: ramSparse * r,
          disk: sparse * STORAGE_OVERHEAD * r,
          muted: !cfg.sparse,
        },
        { name: 'IDs & versions', ram: idTracker * r, disk: idTracker * STORAGE_OVERHEAD * r },
        { name: 'Payload', ram: ramPayload * r, disk: payload * STORAGE_OVERHEAD * r },
        {
          name: cfg.payloadIndexFields > 0 ? 'Payload indexes' : 'Payload indexes (off)',
          ram: payloadIndex * r,
          disk: 0,
          muted: cfg.payloadIndexFields === 0,
        },
        { name: 'Write-ahead log', ram: 0, disk: wal * r },
      ],
    };
  }

  function render(result) {
    el('cp-out-ram').textContent = formatBytes(result.ramRecommended);
    el('cp-out-storage').textContent = formatBytes(result.diskData);
    el('cp-out-cpu').textContent = result.cpu;

    const note = el('cp-out-ram-note');
    note.textContent = result.replicas > 1 ? `recommended · ${result.replicas} replicas` : 'recommended';

    const body = el('cp-breakdown-body');
    body.innerHTML = result.breakdown
      .filter((row) => row.ram > 0 || row.disk > 0)
      .map(
        (row) => `
        <tr${row.muted ? ' class="cp-breakdown__row--muted"' : ''}>
          <td>${row.name}</td>
          <td>${row.ram > 0 ? formatBytes(row.ram) : '—'}</td>
          <td>${row.disk > 0 ? formatBytes(row.disk) : '—'}</td>
        </tr>`
      )
      .join('');
  }

  function syncConditionalFields(cfg) {
    const isProduct = cfg.quantization === 'product';
    const hasQuant = cfg.quantization !== 'none';
    el('cp-pq-ratio-field').hidden = !isProduct;
    el('cp-quant-ram-field').hidden = !hasQuant;
    el('cp-payload-m-field').hidden = !cfg.tenantIndex;
    el('cp-sparse-nnz-field').hidden = !cfg.sparse;
    el('cp-sparse-on-disk-field').hidden = !cfg.sparse;
    el('cp-fusion-field').hidden = !cfg.sparse;
  }

  function renderQuantEffect(cfg) {
    const info = QUANT_INFO[cfg.quantization] || QUANT_INFO.none;
    // Compression factor relative to the chosen storage datatype.
    let factor = '1×';
    if (cfg.quantization === 'scalar') {
      factor = `${(cfg.datatypeBytes / 1).toFixed(0)}×`;
    } else if (cfg.quantization === 'binary') {
      factor = `${(cfg.datatypeBytes * 8).toFixed(0)}×`;
    } else if (cfg.quantization === 'product') {
      factor = `${(cfg.pqRatio / (4 / cfg.datatypeBytes)).toFixed(0)}×`;
    }
    el('cp-quant-effect-name').textContent = info.name;
    el('cp-quant-effect-factor').textContent =
      cfg.quantization === 'none' ? '1× memory' : `${factor} smaller vectors`;
    el('cp-quant-effect-recall').textContent = info.recall;
    el('cp-quant-effect-speed').textContent = info.speed;
    el('cp-quant-effect-best').textContent = info.best;
    el('cp-quant-effect').dataset.mode = cfg.quantization;
  }

  function renderHnswEffect(cfg, ef) {
    let recall = 'balanced recall';
    if (cfg.hnswM <= 8) recall = 'lower recall, leanest index';
    else if (cfg.hnswM >= 32) recall = 'high recall, heaviest index';
    let text =
      `m=${cfg.hnswM} → ${recall}. Index memory scales linearly with m. ` +
      `ef_construct=${ef} controls build quality and time (no steady-state memory impact).`;
    if (cfg.tenantIndex) {
      text += ` Tenant index adds payload_m=${cfg.payloadM} links per point for isolated multitenant search.`;
    }
    el('cp-hnsw-effect').textContent = text;
  }

  const FUSION_INFO = {
    rrf: 'Reciprocal Rank Fusion combines results by rank only — robust and score-scale agnostic. Qdrant default. Negligible resource cost.',
    dbsf: 'Distribution-Based Score Fusion normalizes and sums raw scores — can rank better when score distributions are comparable. Negligible resource cost.',
  };

  function renderFusionEffect(cfg) {
    const note = el('cp-fusion-effect');
    if (!cfg.sparse) {
      note.textContent = '';
      return;
    }
    note.textContent = FUSION_INFO[cfg.fusion] || FUSION_INFO.rrf;
  }

  function renderAdvisories(cfg, parts) {
    const items = [];

    if (parts.hasQuant && parts.ramRawVectors > 0) {
      items.push({
        type: 'tip',
        text: `You're keeping full-precision vectors in RAM alongside quantized copies. Storing originals on disk (memmap) would free ~${formatBytes(parts.ramRawVectors * cfg.replicas)} of RAM — the recommended setup with quantization.`,
      });
    }

    if (parts.hasQuant && cfg.vectorsOnDisk) {
      items.push({
        type: 'tip',
        text: 'Quantized search rescopes top candidates against the original on-disk vectors. Provision spare RAM for OS page cache so rescoring stays fast.',
      });
    }

    if (cfg.quantization === 'binary' && cfg.dims < 1024) {
      items.push({
        type: 'warn',
        text: `Binary quantization works best on high-dimensional embeddings (≥1024d). At ${cfg.dims}d expect noticeable recall loss unless you use query-time oversampling.`,
      });
    }

    if (cfg.quantization === 'product') {
      items.push({
        type: 'warn',
        text: `Product quantization (x${cfg.pqRatio}) gives the most compression but the largest accuracy loss. Always enable rescoring with the original vectors.`,
      });
    }

    if (cfg.hnswOnDisk && parts.hnsw > 0) {
      items.push({
        type: 'tip',
        text: 'HNSW on disk frees RAM but relies on the OS page cache. Leave headroom above the resident figure or first-touch queries will be slower.',
      });
    }

    if (cfg.tenantIndex && parts.tenantLinks > 0) {
      items.push({
        type: 'tip',
        text: `Tenant index (payload_m=${cfg.payloadM}) adds ~${formatBytes(
          parts.tenantLinks * cfg.replicas
        )} of graph links but makes per-tenant filtered search dramatically faster. Pair it with a keyword payload index on the tenant field.`,
      });
    }

    if (cfg.payloadIndexFields > 0 && !cfg.tenantIndex) {
      items.push({
        type: 'tip',
        text: 'For strict per-tenant isolation, enable the tenant payload index (payload_m) above — it builds an isolated subgraph per tenant for much faster filtered search.',
      });
    }

    if (cfg.sparse) {
      items.push({
        type: 'tip',
        text: `Sparse vectors (~${cfg.sparseNnz} non-zeros each) use an inverted index, not HNSW. Its size scales with total non-zero values${
          cfg.sparseOnDisk ? '; it is memory-mapped on disk here' : '; keep it in RAM for fastest lookups'
        }.`,
      });
      items.push({
        type: 'tip',
        text: `Hybrid search with ${cfg.fusion.toUpperCase()} fuses dense + sparse results at query time — this is CPU-only with negligible memory or storage impact.`,
      });
    }

    if (cfg.walMb >= 256) {
      items.push({
        type: 'warn',
        text: `A large WAL (${cfg.walMb} MB × ${cfg.shards} shard${cfg.shards > 1 ? 's' : ''} × ${
          cfg.replicas
        } replica${cfg.replicas > 1 ? 's' : ''}) reserves ${formatBytes(
          parts.wal * cfg.replicas
        )} on disk. Increase only for very high write throughput.`,
      });
    }

    const container = el('cp-advisories');
    if (!items.length) {
      container.hidden = true;
      container.innerHTML = '';
      return;
    }
    container.hidden = false;
    container.innerHTML =
      '<p class="cp-advisories__title">Things to consider</p>' +
      items
        .map(
          (it) =>
            `<div class="cp-advisory cp-advisory--${it.type}"><span class="cp-advisory__icon">${
              it.type === 'warn' ? '!' : 'i'
            }</span><span>${it.text}</span></div>`
        )
        .join('');
  }

  function update() {
    const cfg = readInputs();
    syncConditionalFields(cfg);
    const ef = Math.round(num('cp-hnsw-ef', 100));
    el('cp-hnsw-m-value').textContent = cfg.hnswM;
    el('cp-hnsw-ef-value').textContent = ef;
    el('cp-payload-m-value').textContent = cfg.payloadM;
    renderQuantEffect(cfg);
    renderHnswEffect(cfg, ef);
    renderFusionEffect(cfg);
    const result = estimate(cfg);
    render(result);
    renderAdvisories(cfg, result.parts);
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('reset', () => {
    // Let the browser reset values first, then recompute.
    setTimeout(update, 0);
  });

  update();
});
