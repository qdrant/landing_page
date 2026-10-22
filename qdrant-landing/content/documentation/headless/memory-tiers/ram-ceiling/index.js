/*
 * ram-ceiling island: a static, theme-aware figure for the memory tiers guide
 * (content/documentation/production-operations/memory-tiers.md).
 *
 * No controls. It is an island so the drawing can follow the page theme via
 * the shared --qi-* tokens; index.css maps the figure's own colors for light
 * and dark. Two compositions: the desktop drawing, and a stacked one that
 * index.css swaps in when the figure is narrower than 640px. The fallback
 * PNG in the article is the light desktop drawing.
 */

const LABEL = "Working set as a share of cluster RAM. Conceptual line. A caching configuration's working set climbs toward 100% of cluster RAM as the collection scales and loses its safe margin, then drops back to a safe share once the cluster RAM is upgraded, and keeps growing safely.";

const DESKTOP = `
<text class="mt-title" x="40" y="46">Working set as a share of cluster RAM, as a collection scales</text>
<text class="mt-note" x="40" y="74">conceptual, not to scale</text>
<rect x="111" y="120" width="809" height="64" opacity="0.35" style="fill:var(--mt-red-t)"/>
<line x1="111" x2="920" y1="150" y2="150" stroke-width="1.5" stroke-dasharray="6 5" style="stroke:var(--mt-red)"/>
<text class="mt-note" x="912" y="142" text-anchor="end">100% of cluster RAM</text>
<line x1="523" x2="523" y1="120" y2="470" stroke-width="1.5" stroke-dasharray="4 5" style="stroke:var(--qi-muted)"/>
<text class="mt-note" x="531" y="458">cluster RAM upgraded here</text>
<path d="M110 110 V470 H920" class="mt-axis"/>
<path d="M110 375 C 220 330, 300 300, 360 270 S 470 180, 523 152" fill="none" stroke-width="3" style="stroke:var(--mt-purple)"/>
<path d="M539 256 C 545 340, 560 360, 590 358 C 640 355, 650 330, 740 320 S 860 290, 920 285" fill="none" stroke-width="3" style="stroke:var(--mt-purple)"/>
<circle cx="523" cy="152" r="8" style="fill:var(--mt-red)"/>
<line x1="448" x2="512" y1="167" y2="155" stroke-width="1.5" style="stroke:var(--mt-red)"/>
<text class="mt-note" x="440" y="174" text-anchor="end" style="fill:var(--mt-red-ink);font-weight:600">safe margin gone</text>
<circle cx="539" cy="256" r="8" style="fill:var(--mt-purple)"/>
<text class="mt-note" x="555" y="252" style="fill:var(--mt-purple-ink);font-weight:600">recovers once RAM grows</text>
<text class="mt-note" x="912" y="392" text-anchor="end">still growing, still safe</text>
<text class="mt-note" transform="translate(80 295) rotate(-90)" text-anchor="middle">% of cluster RAM used →</text>
<text class="mt-note" x="515" y="506" text-anchor="middle">collection scale →</text>
`;

const MOBILE = `
<text class="mt-title" x="24" y="40">Working set as a share</text>
<text class="mt-title" x="24" y="68">of cluster RAM, as a</text>
<text class="mt-title" x="24" y="96">collection scales</text>
<text class="mt-note" x="24" y="124">conceptual, not to scale</text>
<rect x="57" y="180" width="399" height="62" opacity="0.35" style="fill:var(--mt-red-t)"/>
<line x1="57" x2="456" y1="209" y2="209" stroke-width="1.5" stroke-dasharray="6 5" style="stroke:var(--mt-red)"/>
<text class="mt-note" x="452" y="236" text-anchor="end">100% of cluster RAM</text>
<line x1="260" x2="260" y1="180" y2="520" stroke-width="1.5" stroke-dasharray="4 5" style="stroke:var(--qi-muted)"/>
<text class="mt-note" x="252" y="486" text-anchor="end">cluster RAM</text>
<text class="mt-note" x="252" y="510" text-anchor="end">upgraded here</text>
<path d="M56 170 V520 H456" class="mt-axis"/>
<path d="M56 428 C 110 384, 150 355, 179 326 S 234 238, 260 211" fill="none" stroke-width="3" style="stroke:var(--mt-purple)"/>
<path d="M268 312 C 271 394, 278 414, 293 412 C 318 409, 323 385, 368 375 S 427 346, 456 341" fill="none" stroke-width="3" style="stroke:var(--mt-purple)"/>
<circle cx="260" cy="211" r="8" style="fill:var(--mt-red)"/>
<text class="mt-note" x="240" y="200" text-anchor="end" style="fill:var(--mt-red-ink);font-weight:600">safe margin gone</text>
<circle cx="268" cy="312" r="8" style="fill:var(--mt-purple)"/>
<text class="mt-note" x="284" y="300" style="fill:var(--mt-purple-ink);font-weight:600">recovers once</text>
<text class="mt-note" x="284" y="324" style="fill:var(--mt-purple-ink);font-weight:600">RAM grows</text>
<text class="mt-note" x="452" y="446" text-anchor="end">still growing,</text>
<text class="mt-note" x="452" y="470" text-anchor="end">still safe</text>
<text class="mt-note" transform="translate(32 345) rotate(-90)" text-anchor="middle">% of cluster RAM used →</text>
<text class="mt-note" x="256" y="554" text-anchor="middle">collection scale →</text>
`;

function svg(variant, [w, h], body) {
  return `<svg class="qi-svg qi-mt__${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mt');
  node.innerHTML = svg('d', [960, 530], DESKTOP) + svg('m', [480, 578], MOBILE);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
