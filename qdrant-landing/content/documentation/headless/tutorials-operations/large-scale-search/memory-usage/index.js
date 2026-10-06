/*
 * memory-usage island: where the 64 GiB of RAM go on the LAION-400M node
 * (content/documentation/tutorials-operations/large-scale-search.md).
 *
 * Static and theme-aware. GiB values are the ones observed on the cluster.
 * Data is the resident heap, so it maps to the pinned tier; cache is the OS
 * page cache that backs mmap'd files, so it maps to the cached tier.
 */

const TOTAL = 64;
const PARTS = [
  { key: 'system', name: 'System', gib: 8.34, tag: '', desc: 'OS and internal systems. Independent of dataset size.' },
  { key: 'cache', name: 'Cache', gib: 14.54, tag: 'cached tier', desc: 'Disk cache for memory-mapped files, mainly the HNSW graph. Evictable under pressure.', text: 'purple' },
  { key: 'data', name: 'Data', gib: 39.27, tag: 'pinned tier', desc: 'Resident memory of the Qdrant process: quantized vectors and the ID tracker. Cannot be evicted; exceeding the limit crashes the process.', text: 'cyan' },
  { key: 'free', name: 'Available', gib: 1.84, tag: '', desc: 'Headroom left on the node.' },
];

const LABEL = 'RAM breakdown of the 64 GiB node: system 8.34 GiB, cache 14.54 GiB, data 39.27 GiB, available 1.84 GiB.';

export function mount(node) {
  node.classList.add('qi-ls-mem');
  const segs = PARTS.map((p) => `<div class="ls-seg ls-seg--${p.key}" style="flex:${p.gib} 1 0"></div>`).join('');
  const rows = PARTS.map(
    (p) => `<li class="ls-row">
      <span class="ls-dot ls-seg--${p.key}"></span>
      <div>
        <div class="ls-name">${p.name}: ${p.gib.toFixed(2)} GiB${p.tag ? `<span class="ls-tag" style="color:var(--ls-${p.text}-text)">${p.tag}</span>` : ''}</div>
        <p class="ls-desc">${p.desc}</p>
      </div>
    </li>`,
  ).join('');
  node.innerHTML = `<div role="img" aria-label="${LABEL}"><div class="ls-bar">${segs}</div></div>
    <div class="ls-scale" aria-hidden="true"><span>0</span><span>${TOTAL} GiB RAM</span></div>
    <ul class="ls-rows">${rows}</ul>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
