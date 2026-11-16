// Sizes in MB, from the post. Square areas are proportional to size: side = K * sqrt(MB).
const K = 280 / Math.sqrt(4280);
const side = (mb) => K * Math.sqrt(mb);

export function buildSvg() {
  const qwen = side(4280);
  const gemma = side(310);
  const chip = side(16);
  const potion = side(7.5);
  const cx = 330;
  const cy = 160;
  return `<svg class="qi-svg be-svg" viewBox="0 0 760 340" role="img" aria-label="Memory footprint as squares with areas proportional to size: Qwen3 Embedding 4B at 4.28GB, about 267 times the 16MB chip; EmbeddingGemma-2 at 8 bits, 310MB, about 19 times the chip; and potion-base-2M at 7.5MB, which fits inside the 16MB square.">
    <rect class="be-sq is-qwen" x="20" y="20" width="${qwen.toFixed(1)}" height="${qwen.toFixed(1)}" rx="4"/>
    <text class="be-sq-title" x="36" y="52">Qwen3 Embedding 4B</text>
    <text class="be-sq-sub" x="36" y="74">4.28GB, about 267 times the chip</text>

    <rect class="be-sq is-gemma" x="${cx}" y="20" width="${gemma.toFixed(1)}" height="${gemma.toFixed(1)}" rx="3"/>
    <text class="qi-label qi-label--strong" x="${cx + gemma + 16}" y="52">EmbeddingGemma-2, 8-bit</text>
    <text class="qi-label" x="${cx + gemma + 16}" y="74">310MB, about 19 times the chip</text>

    <rect class="be-sq is-chip" x="${cx}" y="${cy}" width="${chip.toFixed(1)}" height="${chip.toFixed(1)}" rx="1"/>
    <rect class="be-sq is-potion" x="${cx + (chip - potion) / 2}" y="${cy + (chip - potion) / 2}" width="${potion.toFixed(1)}" height="${potion.toFixed(1)}"/>
    <text class="qi-label qi-label--strong" x="${cx + chip + 16}" y="${cy + 12}">ESP32-S3 flash: 16MB</text>
    <text class="qi-label" x="${cx + chip + 16}" y="${cy + 34}">potion-base-2M: 7.5MB, it fits</text>

    <text class="qi-label" x="${cx}" y="300">Square areas are proportional to size.</text>
  </svg>`;
}

export function mount(node) {
  node.classList.add('be-footprint');
  node.innerHTML = `<div class="qi-fig">${buildSvg()}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
