/*
 * double-copy island: a static, theme-aware figure for the memory tiers guide
 * (content/documentation/production-operations/memory-tiers.md).
 *
 * No controls. It is an island so the drawing can follow the page theme via
 * the shared --qi-* tokens; index.css maps the figure's own colors for light
 * and dark. Two compositions: the desktop drawing, and a stacked one that
 * index.css swaps in when the figure is narrower than 640px. The fallback
 * PNG in the article is the light desktop drawing.
 */

const LABEL = "Caching two copies of the vectors in RAM. Caching the full-precision vectors alone leaves headroom under the cluster RAM budget. Also caching the compressed copy alongside it pushes the resident working set past the budget.";

const DESKTOP = `
<text class="mt-head" x="40" y="56">Caching the full-precision vectors alone</text>
<text class="mt-note" x="800" y="90" text-anchor="end">cluster RAM budget</text>
<rect x="40" y="104" width="760" height="56" rx="8" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<rect x="40" y="104" width="420" height="56" rx="8" style="fill:var(--mt-blue)"/>
<text class="mt-small" x="250" y="139" text-anchor="middle" style="fill:#ffffff">full-precision vectors, cached</text>
<line x1="800" x2="800" y1="96" y2="168" stroke-width="2" style="stroke:var(--qi-fg)"/>
<text class="mt-small mt-muted" x="40" y="216">One resident copy. Room to spare for growth.</text>
<text class="mt-head" x="40" y="252">Also caching the compressed copy alongside it</text>
<text class="mt-note" x="800" y="286" text-anchor="end">cluster RAM budget</text>
<rect x="40" y="300" width="760" height="56" rx="8" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<rect x="452" y="300" width="348" height="56" style="fill:var(--mt-cyan)"/>
<rect x="800" y="300" width="80" height="56" style="fill:var(--mt-red)"/>
<rect x="40" y="300" width="420" height="56" rx="8" style="fill:var(--mt-blue)"/>
<text class="mt-small" x="250" y="335" text-anchor="middle" style="fill:#ffffff">full-precision vectors, cached</text>
<text class="mt-small" x="630" y="335" text-anchor="middle" style="fill:#ffffff">+ compressed copy, cached</text>
<text class="mt-note" x="840" y="384" text-anchor="middle" style="fill:var(--mt-red-ink);font-weight:600">over budget</text>
<line x1="800" x2="800" y1="292" y2="364" stroke-width="2" style="stroke:var(--qi-fg)"/>
<text class="mt-small mt-muted" x="40" y="412">Two resident copies competing for the same budget.</text>
`;

const MOBILE = `
<text class="mt-head" x="24" y="44">Caching the full-precision</text>
<text class="mt-head" x="24" y="70">vectors alone</text>
<text class="mt-note" x="400" y="104" text-anchor="end">cluster RAM budget</text>
<rect x="24" y="116" width="376" height="48" rx="8" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<rect x="24" y="116" width="216" height="48" rx="8" style="fill:var(--mt-blue)"/>
<line x1="400" x2="400" y1="108" y2="172" stroke-width="2" style="stroke:var(--qi-fg)"/>
<rect x="24" y="183" width="16" height="16" rx="2" style="fill:var(--mt-blue)"/><text class="mt-note" x="50" y="198" style="fill:var(--qi-fg)">full-precision vectors, cached</text>
<text class="mt-small mt-muted" x="24" y="236">One resident copy. Room to</text>
<text class="mt-small mt-muted" x="24" y="260">spare for growth.</text>
<text class="mt-head" x="24" y="324">Also caching the compressed</text>
<text class="mt-head" x="24" y="350">copy alongside it</text>
<text class="mt-note" x="400" y="384" text-anchor="end">cluster RAM budget</text>
<rect x="24" y="396" width="376" height="48" rx="8" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<rect x="232" y="396" width="168" height="48" style="fill:var(--mt-cyan)"/>
<rect x="400" y="396" width="56" height="48" style="fill:var(--mt-red)"/>
<rect x="24" y="396" width="216" height="48" rx="8" style="fill:var(--mt-blue)"/>
<line x1="400" x2="400" y1="388" y2="452" stroke-width="2" style="stroke:var(--qi-fg)"/>
<text class="mt-note" x="456" y="472" text-anchor="end" style="fill:var(--mt-red-ink);font-weight:600">over budget</text>
<rect x="24" y="483" width="16" height="16" rx="2" style="fill:var(--mt-blue)"/><text class="mt-note" x="50" y="498" style="fill:var(--qi-fg)">full-precision vectors, cached</text>
<rect x="24" y="511" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/><text class="mt-note" x="50" y="526" style="fill:var(--qi-fg)">compressed copy, cached</text>
<text class="mt-small mt-muted" x="24" y="564">Two resident copies competing</text>
<text class="mt-small mt-muted" x="24" y="588">for the same budget.</text>
`;

function svg(variant, [w, h], body) {
  return `<svg class="qi-svg qi-mt__${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mt');
  node.innerHTML = svg('d', [960, 440], DESKTOP) + svg('m', [480, 612], MOBILE);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
