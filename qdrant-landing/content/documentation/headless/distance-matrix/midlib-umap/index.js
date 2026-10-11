// Midlib map: 1000 sampled items from the Midlib collection. Positions are UMAP of the Qdrant distance
// matrix (sample=1000, limit=20, distances = 1 - cosine similarity, n_neighbors=20, random_state=7).
// Clusters are KMeans (10 clusters) on the symmetrized similarity rows. Data: /articles_data/distance-based-exploration/midlib-map.json.
const NS = 'http://www.w3.org/2000/svg';

export async function mount(node) {
  try {
    const response = await fetch('/articles_data/distance-based-exploration/midlib-map.json');
    if (!response.ok) throw new Error(`Midlib map request failed: ${response.status}`);
    render(node, await response.json());
  } catch (error) {
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
  }
}

function render(node, data) {
  node.classList.add('qi-mm');
  const count = data.sizes.length;
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-mm__legend qi-group" role="group" aria-label="Highlight a cluster"></div>
      <svg class="qi-svg" viewBox="0 0 ${data.W} ${data.H}" role="img" aria-label="UMAP map of ${data.cluster.length} sampled Midlib items, colored by ${count} KMeans clusters">
        <rect class="qi-frame" x="1" y="1" width="${data.W - 2}" height="${data.H - 2}" rx="6"/>
        <g class="qi-mm__dots"></g>
      </svg>
      <p class="qi-status qi-status--2" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  const find = selector => node.querySelector(selector);
  const dots = find('.qi-mm__dots');
  const legend = find('.qi-mm__legend');
  const status = find('.qi-status');
  const circles = [];
  for (let i = 0; i < data.cluster.length; i++) {
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', data.xy[i * 2]);
    circle.setAttribute('cy', data.xy[i * 2 + 1]);
    circle.setAttribute('r', 4);
    dots.append(circle);
    circles.push(circle);
  }
  const chips = data.sizes.map((size, k) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'qi-chip';
    chip.setAttribute('aria-pressed', 'false');
    chip.innerHTML = `<span class="qi-chip__swatch" style="--swatch: var(--mm-${k})" aria-hidden="true"></span>${k + 1} <small>${size}</small>`;
    chip.setAttribute('aria-label', `Cluster ${k + 1}, ${size} items`);
    legend.append(chip);
    return chip;
  });

  let picked = null;

  function update() {
    chips.forEach((chip, k) => chip.setAttribute('aria-pressed', String(picked === k)));
    circles.forEach((circle, i) => {
      const k = +data.cluster[i];
      circle.style.fill = `var(--mm-${k})`;
      circle.classList.toggle('is-faded', picked !== null && picked !== k);
    });
    status.textContent = picked === null
        ? `KMeans finds ${count} clusters, from ${Math.max(...data.sizes)} items down to ${Math.min(...data.sizes)}. Select a cluster to highlight it.`
        : `Cluster ${picked + 1}: ${data.sizes[picked]} of ${data.cluster.length} items.`;
  }

  chips.forEach((chip, k) => chip.addEventListener('click', () => {
    picked = picked === k ? null : k;
    update();
  }));

  update();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
