// Fashion-MNIST UMAP: 14000 of the 70000 images, umap-learn defaults, random_state=42.
// Data: /articles_data/distance-based-exploration/fashion-umap.json. Class colors are invariant across themes.
const NS = 'http://www.w3.org/2000/svg';
const NAMES = ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat', 'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot'];

export async function mount(node) {
  try {
    const response = await fetch('/articles_data/distance-based-exploration/fashion-umap.json');
    if (!response.ok) throw new Error(`Fashion-MNIST map request failed: ${response.status}`);
    render(node, await response.json());
  } catch (error) {
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
  }
}

function render(node, data) {
  node.classList.add('qi-fm');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-fm__legend qi-group" role="group" aria-label="Highlight a clothing category"></div>
      <svg class="qi-svg" viewBox="0 0 ${data.W} ${data.H}" role="img" aria-label="UMAP of Fashion-MNIST, colored by the ten clothing categories">
        <rect class="qi-frame" x="1" y="1" width="${data.W - 2}" height="${data.H - 2}" rx="6"/>
      </svg>
      <p class="qi-status qi-status--2" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  const svg = node.querySelector('.qi-svg');
  const legend = node.querySelector('.qi-fm__legend');
  const status = node.querySelector('.qi-status');
  const paths = NAMES.map((_, k) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'qi-fm__dots');
    path.style.stroke = `var(--fm-${k})`;
    svg.append(path);
    return path;
  });
  const parts = NAMES.map(() => []);
  const counts = NAMES.map(() => 0);
  for (let i = 0; i < data.cls.length; i++) {
    const k = +data.cls[i];
    parts[k].push(`M${data.xy[i * 2]} ${data.xy[i * 2 + 1]}h0`);
    counts[k]++;
  }
  paths.forEach((path, k) => path.setAttribute('d', parts[k].join('')));

  const chips = NAMES.map((name, k) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'qi-chip';
    chip.setAttribute('aria-pressed', 'false');
    chip.innerHTML = `<span class="qi-chip__swatch" style="--swatch: var(--fm-${k})" aria-hidden="true"></span>${name}`;
    legend.append(chip);
    return chip;
  });

  let picked = null;
  function update() {
    chips.forEach((chip, k) => chip.setAttribute('aria-pressed', String(picked === k)));
    paths.forEach((path, k) => path.classList.toggle('is-faded', picked !== null && picked !== k));
    status.textContent = picked === null
      ? 'Each color is one clothing category. UMAP never saw the labels, yet the categories form their own regions. Select a category to highlight it.'
      : `${NAMES[picked]}: ${counts[picked]} of ${data.cls.length} plotted images.`;
  }
  chips.forEach((chip, k) => chip.addEventListener('click', () => {
    picked = picked === k ? null : k;
    update();
  }));

  update();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
