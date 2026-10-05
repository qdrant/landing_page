/*
 * float32-distribution island — theme-aware replacement for float32-distribution.png.
 *
 * Drawn in the style of the CTO-validated bit-depth island: the distribution
 * of one dimension's float32 values as a bell of stacked squares, with the
 * quantile 0.99 range [-2.0, +5.0] marked by red threshold lines and a band.
 * Squares outside the range are the outliers that get clipped. The bell is
 * illustrative, centered on the range like the original figure.
 */

const VB_W = 700;
const VB_H = 206;
const V_MIN = -4;
const V_MAX = 7;
const X0 = 30;
const X1 = 670;
const BINS = 16;
const SQ = 20;
const SQ_PITCH = 22;
const BASE_Y = 156;
const BAND_Y = 166;
const LO = -2.0;
const HI = 5.0;
const MU = (LO + HI) / 2;
const SIGMA = (HI - LO) / 2 / 2.576; // 99% of a normal lies within ±2.576σ

const x = (v) => X0 + ((v - V_MIN) / (V_MAX - V_MIN)) * (X1 - X0);

function squares() {
  const pitch = (X1 - X0) / BINS;
  const out = [];
  for (let b = 0; b < BINS; b++) {
    const lo = V_MIN + b * ((V_MAX - V_MIN) / BINS);
    const center = lo + (V_MAX - V_MIN) / BINS / 2;
    const n = Math.round(5 * Math.exp(-(((center - MU) / SIGMA) ** 2) / 2));
    const kept = center >= LO && center <= HI;
    const sx = (X0 + b * pitch + (pitch - SQ) / 2).toFixed(1);
    for (let k = 0; k < n; k++) {
      const y = BASE_Y - 3 - (k + 1) * SQ_PITCH + (SQ_PITCH - SQ);
      out.push(`<rect class="qi-sq__cell" x="${sx}" y="${y}" width="${SQ}" height="${SQ}" rx="2" fill="var(--sq-shade-${kept ? 3 : 1})"/>`);
    }
  }
  return out.join('');
}

export function mount(node) {
  node.classList.add('qi-sq');
  node.innerHTML = `
<div class="qi-fig">
  <svg class="qi-svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"
    aria-label="The distribution of one dimension's float32 values. Quantile 0.99 keeps the range from -2.0 to +5.0; the values outside it are outliers that get clipped.">
    <text class="qi-label" x="0" y="14">Distribution of float32 values · one dimension</text>
    ${squares()}
    <line class="qi-axis" x1="${X0 - 6}" y1="${BASE_Y}" x2="${X1 + 6}" y2="${BASE_Y}"/>
    <line class="qi-sq__threshold" x1="${x(LO)}" y1="30" x2="${x(LO)}" y2="${BAND_Y + 12}"/>
    <line class="qi-sq__threshold" x1="${x(HI)}" y1="30" x2="${x(HI)}" y2="${BAND_Y + 12}"/>
    <text class="qi-label qi-sq__threshold-label" x="${x(LO) - 6}" y="44" text-anchor="end">-2.0</text>
    <text class="qi-label qi-sq__threshold-label" x="${x(HI) + 6}" y="44">+5.0</text>
    <rect class="qi-sq__band" x="${x(LO)}" y="${BAND_Y}" width="${x(HI) - x(LO)}" height="12" rx="3"/>
    <text class="qi-label qi-label--strong" x="${(x(LO) + x(HI)) / 2}" y="${BAND_Y + 30}" text-anchor="middle">quantile 0.99 · kept range</text>
    <text class="qi-label" x="${X0}" y="${BAND_Y + 30}">outliers</text>
    <text class="qi-label" x="${X1}" y="${BAND_Y + 30}" text-anchor="end">outliers</text>
  </svg>
</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
