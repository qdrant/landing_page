/*
 * efficient-corner island: a static, theme-aware figure for the memory tiers guide
 * (content/documentation/production-operations/memory-tiers.md).
 *
 * No controls. It is an island so the drawing can follow the page theme via
 * the shared --qi-* tokens; index.css maps the figure's own colors for light
 * and dark. Two compositions: the desktop drawing, and a stacked one that
 * index.css swaps in when the figure is narrower than 640px. The fallback
 * PNG in the article is the light desktop drawing.
 */

const LABEL = "Search latency versus memory footprint. Conceptual scatter. Pinned quantized vectors sit in the efficient corner of low latency and low memory, at the same latency as full cached with no quantization but with far less memory. Full cold with no quantization is light but slow on cache misses. Full cold with quantization and full cached with quantization sit in between.";

const DESKTOP = `
<text class="mt-title" x="40" y="46">Search latency versus memory footprint</text>
<text class="mt-note" x="40" y="74">conceptual, not to scale</text>
<rect x="112" y="300" width="330" height="168" rx="8" style="fill:var(--mt-cyan-t)"/>
<text class="mt-label" x="128" y="330" style="fill:var(--mt-cyan-ink);font-weight:600">efficient corner</text>
<text class="mt-note" x="128" y="356" style="fill:var(--mt-cyan-ink)">fast and light</text>
<path d="M110 110 V470 H920" class="mt-axis"/>
<text class="mt-note" transform="translate(80 290) rotate(-90)" text-anchor="middle">search latency →</text>
<text class="mt-note" x="515" y="510" text-anchor="middle">memory footprint →</text>
<line x1="222" x2="786" y1="417" y2="417" stroke-width="1.5" stroke-dasharray="5 5" style="stroke:var(--qi-muted)"/>
<text class="mt-note" x="610" y="446" text-anchor="middle">same speed, less memory</text>
<circle cx="208" cy="417" r="10" style="fill:var(--mt-cyan)"/>
<text class="mt-label" x="128" y="456" style="font-weight:600">pinned quantized vectors</text>
<circle cx="799" cy="417" r="8" style="fill:var(--mt-purple)"/>
<text class="mt-label" x="799" y="372" text-anchor="middle" style="fill:var(--mt-purple-text)">full cached,</text>
<text class="mt-note" x="799" y="398" text-anchor="middle">no quantization</text>
<circle cx="191" cy="164" r="8" style="fill:var(--mt-red)"/>
<text class="mt-label" x="210" y="162" style="fill:var(--mt-red-ink)">full cold, no quantization</text>
<text class="mt-note" x="210" y="188">light, but slow on cache misses</text>
<circle cx="475" cy="309" r="8" style="fill:var(--qi-line)"/>
<text class="mt-label mt-muted" x="492" y="306">full cold,</text>
<text class="mt-note" x="492" y="330">with quantization</text>
<circle cx="855" cy="273" r="8" style="fill:var(--qi-line)"/>
<text class="mt-label mt-muted" x="840" y="244" text-anchor="end">full cached,</text>
<text class="mt-note" x="840" y="268" text-anchor="end">with quantization</text>
`;

const MOBILE = `
<text class="mt-title" x="24" y="42">Search latency versus</text>
<text class="mt-title" x="24" y="70">memory footprint</text>
<text class="mt-note" x="24" y="98">conceptual, not to scale</text>
<rect x="66" y="330" width="200" height="138" rx="8" style="fill:var(--mt-cyan-t)"/>
<text class="mt-small" x="78" y="356" style="fill:var(--mt-cyan-ink);font-weight:600">efficient corner</text>
<text class="mt-note" x="78" y="380" style="fill:var(--mt-cyan-ink)">fast and light</text>
<path d="M64 120 V470 H456" class="mt-axis"/>
<text class="mt-note" transform="translate(40 295) rotate(-90)" text-anchor="middle">search latency →</text>
<text class="mt-note" x="260" y="504" text-anchor="middle">memory footprint →</text>
<line x1="126" x2="382" y1="418" y2="418" stroke-width="1.5" stroke-dasharray="5 5" style="stroke:var(--qi-muted)"/>
<text class="mt-note" x="292" y="448" text-anchor="middle">same speed,</text>
<text class="mt-note" x="292" y="470" text-anchor="middle">less memory</text>
<circle cx="111" cy="418" r="13" style="fill:var(--mt-cyan)"/>
<text x="111" y="424" text-anchor="middle" style="font-size:17px;font-weight:600;fill:#ffffff">1</text>
<circle cx="40" cy="545" r="13" style="fill:var(--mt-cyan)"/>
<text x="40" y="551" text-anchor="middle" style="font-size:17px;font-weight:600;fill:#ffffff">1</text>
<text class="mt-small" x="64" y="552" style="font-weight:600">pinned quantized vectors</text>
<circle cx="397" cy="418" r="13" style="fill:var(--mt-purple)"/>
<text x="397" y="424" text-anchor="middle" style="font-size:17px;font-weight:600;fill:#ffffff">2</text>
<circle cx="40" cy="583" r="13" style="fill:var(--mt-purple)"/>
<text x="40" y="589" text-anchor="middle" style="font-size:17px;font-weight:600;fill:#ffffff">2</text>
<text class="mt-small" x="64" y="590">full cached, no quantization</text>
<circle cx="103" cy="172" r="13" style="fill:var(--mt-red)"/>
<text x="103" y="178" text-anchor="middle" style="font-size:17px;font-weight:600;fill:#ffffff">3</text>
<circle cx="40" cy="621" r="13" style="fill:var(--mt-red)"/>
<text x="40" y="627" text-anchor="middle" style="font-size:17px;font-weight:600;fill:#ffffff">3</text>
<text class="mt-small" x="64" y="628">full cold, no quantization</text>
<text class="mt-note" x="64" y="654">light, but slow on cache misses</text>
<circle cx="241" cy="313" r="13" style="fill:var(--qi-line)"/>
<text x="241" y="319" text-anchor="middle" style="font-size:17px;font-weight:600;fill:var(--qi-fg)">4</text>
<circle cx="40" cy="677" r="13" style="fill:var(--qi-line)"/>
<text x="40" y="683" text-anchor="middle" style="font-size:17px;font-weight:600;fill:var(--qi-fg)">4</text>
<text class="mt-small" x="64" y="684">full cold, with quantization</text>
<circle cx="425" cy="278" r="13" style="fill:var(--qi-line)"/>
<text x="425" y="284" text-anchor="middle" style="font-size:17px;font-weight:600;fill:var(--qi-fg)">5</text>
<circle cx="40" cy="715" r="13" style="fill:var(--qi-line)"/>
<text x="40" y="721" text-anchor="middle" style="font-size:17px;font-weight:600;fill:var(--qi-fg)">5</text>
<text class="mt-small" x="64" y="722">full cached, with quantization</text>
`;

function svg(variant, [w, h], body) {
  return `<svg class="qi-svg qi-mt__${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mt');
  node.innerHTML = svg('d', [960, 540], DESKTOP) + svg('m', [480, 766], MOBILE);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
