// scikit-learn plot_cluster_comparison, six of the eleven algorithms, same toy datasets and parameters
// (500 points, StandardScaler, random_state=42). Data: /articles_data/distance-based-exploration/sklearn-clustering.json.
// Labels: hex digit per point, "n" is noise (-1). Colors are invariant across themes.
const NS = 'http://www.w3.org/2000/svg';
const SHORT = ['KMeans', 'Spectral', 'Ward', 'DBSCAN', 'HDBSCAN', 'GMM'];
const CELL = 200;
const GAP = 12;
const PAD = 10;

export async function mount(node) {
  try {
    const response = await fetch('/articles_data/distance-based-exploration/sklearn-clustering.json');
    if (!response.ok) throw new Error(`Clustering request failed: ${response.status}`);
    render(node, await response.json());
  } catch (error) {
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
  }
}

function render(node, data) {
  node.classList.add('qi-sc');
  const cols = data.algorithms.length;
  const rows = data.datasets.length;
  const W = cols * CELL + (cols - 1) * GAP;
  const H = rows * CELL + (rows - 1) * GAP;
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-sc__heads">${SHORT.map(name => `<span>${name}</span>`).join('')}</div>
      <svg class="qi-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${cols} clustering algorithms applied to ${rows} two-dimensional datasets"></svg>
      <p class="qi-status qi-status--2">Each column applies one algorithm to the same six datasets.</p>
    </div>`;

  const svg = node.querySelector('.qi-svg');
  const span = CELL - 2 * PAD;
  data.datasets.forEach((dataset, r) => {
    for (let c = 0; c < cols; c++) {
      const ox = c * (CELL + GAP);
      const oy = r * (CELL + GAP);
      const group = document.createElementNS(NS, 'g');
      group.innerHTML = `<rect class="qi-frame" x="${ox + 1}" y="${oy + 1}" width="${CELL - 2}" height="${CELL - 2}" rx="4"/>`;
      const parts = {};
      const labels = dataset.labels[c];
      for (let i = 0; i < labels.length; i++) {
        (parts[labels[i]] ||= []).push(`M${(ox + PAD + dataset.xy[i * 2] * span / 1000).toFixed(1)} ${(oy + PAD + dataset.xy[i * 2 + 1] * span / 1000).toFixed(1)}h0`);
      }
      for (const [label, d] of Object.entries(parts)) {
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('class', 'qi-sc__dots');
        path.setAttribute('d', d.join(''));
        path.style.stroke = label === 'n' ? 'var(--sc-noise)' : `var(--sc-${parseInt(label, 16) % 7})`;
        group.append(path);
      }
      svg.append(group);
    }
  });

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
