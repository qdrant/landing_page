/*
 * hardware island: the minimal node for the LAION-400M tutorial
 * (content/documentation/tutorials-operations/large-scale-search.md).
 *
 * Static and theme-aware. Values are the ones observed on the cluster after
 * upload and indexing finished; the fallback PNG is the original dashboard
 * screenshot.
 */

const CARDS = [
  { head: 'RAM', req: '64 GiB', used: '62.16 GiB of 64.00 GiB', pct: 62.16 / 64 },
  { head: 'CPU', req: '8 vCPUs', used: '0.65 vCPUs of 8 vCPUs, while idle', pct: 0.65 / 8 },
  { head: 'Disk', req: '1 TB', used: '610.14 GiB of 1.03 TiB', pct: 610.14 / (1.03 * 1024) },
];

const LABEL = 'Single node used for 400 million vectors: 64 GiB of RAM with 62.16 GiB in use, 8 vCPUs with 0.65 in use while idle, and 1.03 TiB of disk with 610.14 GiB in use.';

export function mount(node) {
  node.classList.add('qi-ls-hw');
  const cards = CARDS.map(
    (c) => `<div class="ls-card">
      <p class="ls-head">${c.head}</p>
      <p class="ls-req">${c.req}</p>
      <div class="ls-track" aria-hidden="true"><div class="ls-fill" style="width:${(c.pct * 100).toFixed(1)}%"></div></div>
      <p class="ls-used">${c.used}</p>
    </div>`,
  ).join('');
  node.innerHTML = `<div role="img" aria-label="${LABEL}"><div class="ls-cards">${cards}</div></div>
    <p class="ls-note">One node, observed after upload and indexing finished.</p>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
