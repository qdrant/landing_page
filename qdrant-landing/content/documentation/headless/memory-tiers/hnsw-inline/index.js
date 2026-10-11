/*
 * hnsw-inline island: a static, theme-aware figure for the memory tiers guide
 * (content/documentation/production-operations/memory-tiers.md).
 *
 * No controls. It is an island so the drawing can follow the page theme via
 * the shared --qi-* tokens; index.css maps the figure's own colors for light
 * and dark. Two compositions: the desktop drawing, and a stacked one that
 * index.css swaps in when the figure is narrower than 640px. The fallback
 * PNG in the article is the light desktop drawing.
 */

const LABEL = "HNSW inline storage and on-disk graph size. A standard HNSW graph stores a link per edge. Inline storage also stores a compressed copy of the neighbor's vector on every edge, so on-disk graph size grows with edge count and the gap to the standard graph widens as a collection scales.";

const DESKTOP = `
<line x1="420" x2="420" y1="32" y2="448" style="stroke:var(--qi-border)"/>
<text class="mt-head" x="40" y="56">Per-edge storage</text>
<rect x="40" y="110" width="88" height="88" rx="10" style="fill:var(--mt-blue-t)"/>
<line x1="84" y1="154" x2="84.0" y2="122.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="84.0" cy="122.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="84" y1="154" x2="56.3" y2="138.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="56.3" cy="138.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="84" y1="154" x2="56.3" y2="170.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="56.3" cy="170.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="84" y1="154" x2="84.0" y2="186.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="84.0" cy="186.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="84" y1="154" x2="111.7" y2="170.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="111.7" cy="170.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="84" y1="154" x2="111.7" y2="138.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="111.7" cy="138.0" r="5" style="fill:var(--mt-blue)"/>
<circle cx="84" cy="154" r="8" style="fill:var(--mt-blue)"/>
<rect x="40" y="270" width="88" height="88" rx="10" style="fill:var(--mt-purple-t)"/>
<line x1="84" y1="314" x2="84.0" y2="282.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="84.0" cy="282.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="79.0" y="292.0" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="84" y1="314" x2="56.3" y2="298.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="56.3" cy="298.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="64.3" y="300.5" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="84" y1="314" x2="56.3" y2="330.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="56.3" cy="330.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="64.3" y="317.5" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="84" y1="314" x2="84.0" y2="346.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="84.0" cy="346.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="79.0" y="326.0" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="84" y1="314" x2="111.7" y2="330.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="111.7" cy="330.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="93.7" y="317.5" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="84" y1="314" x2="111.7" y2="298.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="111.7" cy="298.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="93.7" y="300.5" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<circle cx="84" cy="314" r="8" style="fill:var(--mt-purple)"/>
<text class="mt-head" x="146" y="128">Standard graph</text>
<text class="mt-small mt-muted" x="146" y="156">An edge stores only a</text>
<text class="mt-small mt-muted" x="146" y="180">link to its neighbor.</text>
<text class="mt-head" x="146" y="288">Inline storage</text>
<text class="mt-small mt-muted" x="146" y="316">Every edge also</text>
<text class="mt-small mt-muted" x="146" y="340">carries its own</text>
<text class="mt-small mt-muted" x="146" y="364">compressed copy of the</text>
<text class="mt-small mt-muted" x="146" y="388">neighbor's vector.</text>
<text class="mt-head" x="444" y="56">On-disk graph size as a</text>
<text class="mt-head" x="444" y="82">collection grows</text>
<text class="mt-note" x="444" y="108">conceptual, not to scale</text>
<path d="M484.0 410.0 C 636.6 404.8, 710.7 350.2, 920.0 160.4 L920.0 272.2 Q 710.7 337.2, 484.0 410.0 Z" opacity="0.6" style="fill:var(--mt-purple-t)"/>
<path d="M484 130 V410 H930" class="mt-axis"/>
<path d="M484.0 410.0 Q 710.7 337.2, 920.0 272.2" fill="none" stroke-width="3" style="stroke:var(--mt-blue)"/>
<path d="M484.0 410.0 C 636.6 404.8, 710.7 350.2, 920.0 160.4" fill="none" stroke-width="3" style="stroke:var(--mt-purple)"/>
<circle cx="920" cy="160.4" r="6" style="fill:var(--mt-purple)"/>
<circle cx="920" cy="272.2" r="6" style="fill:var(--mt-blue)"/>
<text class="mt-small" x="904" y="152" text-anchor="end" style="fill:var(--mt-purple-ink)">inline storage</text>
<text class="mt-small" x="904" y="362" text-anchor="end" style="fill:var(--mt-blue-ink)">standard graph</text>
<line x1="796" x2="864" y1="216" y2="250" stroke-width="1.5" style="stroke:var(--qi-muted)"/>
<text class="mt-note" x="790" y="214" text-anchor="end">gap widens with edge count</text>
<text class="mt-note" transform="translate(462 280) rotate(-90)" text-anchor="middle">on-disk graph size →</text>
<text class="mt-note" x="702" y="442" text-anchor="middle">edge count →</text>
`;

const MOBILE = `
<text class="mt-head" x="24" y="44">Per-edge storage</text>
<rect x="24" y="72" width="88" height="88" rx="10" style="fill:var(--mt-blue-t)"/>
<line x1="68" y1="116" x2="68.0" y2="84.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="68.0" cy="84.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="68" y1="116" x2="40.3" y2="100.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="40.3" cy="100.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="68" y1="116" x2="40.3" y2="132.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="40.3" cy="132.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="68" y1="116" x2="68.0" y2="148.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="68.0" cy="148.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="68" y1="116" x2="95.7" y2="132.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="95.7" cy="132.0" r="5" style="fill:var(--mt-blue)"/>
<line x1="68" y1="116" x2="95.7" y2="100.0" stroke-width="2" style="stroke:var(--mt-blue)"/>
<circle cx="95.7" cy="100.0" r="5" style="fill:var(--mt-blue)"/>
<circle cx="68" cy="116" r="8" style="fill:var(--mt-blue)"/>
<rect x="24" y="192" width="88" height="88" rx="10" style="fill:var(--mt-purple-t)"/>
<line x1="68" y1="236" x2="68.0" y2="204.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="68.0" cy="204.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="63.0" y="214.0" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="68" y1="236" x2="40.3" y2="220.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="40.3" cy="220.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="48.3" y="222.5" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="68" y1="236" x2="40.3" y2="252.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="40.3" cy="252.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="48.3" y="239.5" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="68" y1="236" x2="68.0" y2="268.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="68.0" cy="268.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="63.0" y="248.0" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="68" y1="236" x2="95.7" y2="252.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="95.7" cy="252.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="77.7" y="239.5" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<line x1="68" y1="236" x2="95.7" y2="220.0" stroke-width="2" style="stroke:var(--mt-purple)"/>
<circle cx="95.7" cy="220.0" r="5" style="fill:var(--mt-purple)"/>
<rect x="77.7" y="222.5" width="10" height="10" rx="1.5" stroke-width="2" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<circle cx="68" cy="236" r="8" style="fill:var(--mt-purple)"/>
<text class="mt-head" x="130" y="90">Standard graph</text>
<text class="mt-small mt-muted" x="130" y="118">An edge stores only a</text>
<text class="mt-small mt-muted" x="130" y="142">link to its neighbor.</text>
<text class="mt-head" x="130" y="210">Inline storage</text>
<text class="mt-small mt-muted" x="130" y="238">Every edge also carries</text>
<text class="mt-small mt-muted" x="130" y="262">its own compressed copy</text>
<text class="mt-small mt-muted" x="130" y="286">of the neighbor's vector.</text>
<line x1="24" x2="456" y1="316" y2="316" style="stroke:var(--qi-border)"/>
<text class="mt-head" x="24" y="354">On-disk graph size as a</text>
<text class="mt-head" x="24" y="380">collection grows</text>
<text class="mt-note" x="24" y="406">conceptual, not to scale</text>
<path d="M64.0 700.0 C 195.6 695.0, 259.5 642.5, 440.0 460.0 L440.0 567.5 Q 259.5 630.0, 64.0 700.0 Z" opacity="0.6" style="fill:var(--mt-purple-t)"/>
<path d="M64 430 V700 H450" class="mt-axis"/>
<path d="M64.0 700.0 Q 259.5 630.0, 440.0 567.5" fill="none" stroke-width="3" style="stroke:var(--mt-blue)"/>
<path d="M64.0 700.0 C 195.6 695.0, 259.5 642.5, 440.0 460.0" fill="none" stroke-width="3" style="stroke:var(--mt-purple)"/>
<circle cx="440" cy="460.0" r="6" style="fill:var(--mt-purple)"/>
<circle cx="440" cy="567.5" r="6" style="fill:var(--mt-blue)"/>
<text class="mt-note" transform="translate(44 575) rotate(-90)" text-anchor="middle">on-disk graph size →</text>
<text class="mt-note" x="252" y="730" text-anchor="middle">edge count →</text>
<line x1="24" x2="46" y1="766" y2="766" stroke-width="3" style="stroke:var(--mt-purple)"/><text class="mt-note" x="56" y="772" style="fill:var(--qi-fg)">inline storage</text>
<line x1="24" x2="46" y1="796" y2="796" stroke-width="3" style="stroke:var(--mt-blue)"/><text class="mt-note" x="56" y="802" style="fill:var(--qi-fg)">standard graph</text>
<rect x="24" y="818" width="22" height="16" opacity="0.6" style="fill:var(--mt-purple-t)"/>
<text class="mt-note" x="56" y="832" style="fill:var(--qi-fg)">gap widens with edge count</text>
`;

function svg(variant, [w, h], body) {
  return `<svg class="qi-svg qi-mt__${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mt');
  node.innerHTML = svg('d', [960, 470], DESKTOP) + svg('m', [480, 858], MOBILE);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
