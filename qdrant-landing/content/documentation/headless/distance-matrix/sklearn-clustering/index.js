// scikit-learn plot_cluster_comparison, six of the eleven algorithms, same toy datasets and parameters
// (500 points, StandardScaler, random_state=42). Data: /articles_data/distance-based-exploration/sklearn-clustering.json.
// Labels: hex digit per point, "n" is noise (-1). Colors are invariant across themes.
const NS = 'http://www.w3.org/2000/svg';
const SHORT = ['KMeans', 'Spectral', 'Ward', 'DBSCAN', 'HDBSCAN', 'GMM'];
const NOTES = [
  'assigns each point to the nearest of k centers, so it finds round, similar-sized groups.',
  'clusters on a nearest-neighbor graph, so it follows the shape of rings and moons.',
  'merges the closest groups bottom-up, here limited to neighbors by a connectivity graph.',
  'grows clusters through dense regions and marks sparse points as noise, shown in yellow.',
  'is DBSCAN across many density levels; points it cannot place are noise, shown in yellow.',
  'fits k Gaussians, so it finds elliptical groups.',
];
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
      <div class="qi-controls">
        <div class="qi-group qi-sc__chips" role="group" aria-label="Highlight an algorithm"></div>
      </div>
      <div class="qi-sc__heads" aria-hidden="true">${SHORT.map(name => `<span>${name}</span>`).join('')}</div>
      <svg class="qi-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${cols} clustering algorithms applied to ${rows} two-dimensional datasets"></svg>
      <p class="qi-status qi-status--2" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  const svg = node.querySelector('.qi-svg');
  const heads = [...node.querySelectorAll('.qi-sc__heads span')];
  const cells = Array.from({ length: cols }, () => []);
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
      cells[c].push(group);
    }
  });

  const chips = data.algorithms.map((name, c) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'qi-chip';
    chip.setAttribute('aria-pressed', 'false');
    chip.textContent = name;
    node.querySelector('.qi-sc__chips').append(chip);
    return chip;
  });
  const status = node.querySelector('.qi-status');

  let picked = null;
  function update() {
    chips.forEach((chip, c) => chip.setAttribute('aria-pressed', String(picked === c)));
    cells.forEach((column, c) => column.forEach(group => group.classList.toggle('is-faded', picked !== null && picked !== c)));
    heads.forEach((head, c) => head.classList.toggle('is-faded', picked !== null && picked !== c));
    status.textContent = picked === null
      ? 'Every column runs one algorithm on the same six datasets, each color is one cluster found. Select an algorithm to highlight it.'
      : `${data.algorithms[picked]} ${NOTES[picked]}`;
  }
  chips.forEach((chip, c) => chip.addEventListener('click', () => {
    picked = picked === c ? null : c;
    update();
  }));

  update();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
