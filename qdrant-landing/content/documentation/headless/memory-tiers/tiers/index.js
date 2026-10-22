/*
 * tiers island: a static, theme-aware figure for the memory tiers guide
 * (content/documentation/production-operations/memory-tiers.md).
 *
 * No controls. It is an island so the drawing can follow the page theme via
 * the shared --qi-* tokens; index.css maps the figure's own colors for light
 * and dark. Two compositions: the desktop drawing, and a stacked one that
 * index.css swaps in when the figure is narrower than 640px. The fallback
 * PNG in the article is the light desktop drawing.
 */

const LABEL = "Qdrant's three memory tiers. Any structure picks one of three tiers independently. Cold lives on disk: low RAM, slowest. Cached lives in the OS page cache in RAM: high RAM, evictable. Pinned lives on the heap in RAM: fixed RAM, fastest.";

const DESKTOP = `
<defs><marker id="mt-arrow-d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--qi-line)"/></marker></defs>
<rect x="200" y="24" width="560" height="50" rx="8" stroke-dasharray="5 4" style="fill:var(--mt-card);stroke:var(--qi-line)"/>
<text class="mt-label" x="480" y="56" text-anchor="middle">Any structure picks a tier, independently</text>
<path d="M480 74 V96 H165 V116" class="mt-axis" stroke-width="2" marker-end="url(#mt-arrow-d)"/>
<path d="M480 74 V96 H795 V116" class="mt-axis" stroke-width="2" marker-end="url(#mt-arrow-d)"/>
<path d="M480 74 V116" class="mt-axis" stroke-width="2" marker-end="url(#mt-arrow-d)"/>
<rect x="20" y="120" width="290" height="216" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-label" x="165.0" y="160" text-anchor="middle" style="font-size:26px;font-weight:600;fill:var(--mt-blue-text)">Cold</text>
<rect x="40" y="178" width="250" height="88" rx="8" stroke-width="1.5" style="fill:var(--mt-inset);stroke:var(--mt-blue)"/>
<text class="mt-label" x="165.0" y="204" text-anchor="middle">Disk</text>
<circle cx="107.0" cy="238" r="7" style="fill:var(--mt-blue)"/>
<circle cx="135.0" cy="230" r="7" style="fill:var(--mt-blue)"/>
<circle cx="151.0" cy="248" r="7" style="fill:var(--mt-blue)"/>
<circle cx="183.0" cy="252" r="7" style="fill:var(--mt-blue)"/>
<circle cx="213.0" cy="240" r="7" style="fill:var(--mt-blue)"/>
<rect x="50.0" y="282" width="110.0" height="34" rx="17.0" style="fill:var(--mt-blue-t)"/><text x="105.0" y="306.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">low RAM</text>
<rect x="170.0" y="282" width="110.0" height="34" rx="17.0" style="fill:var(--mt-blue-t)"/><text x="225.0" y="306.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">slowest</text>
<rect x="335" y="120" width="290" height="216" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-label" x="480.0" y="160" text-anchor="middle" style="font-size:26px;font-weight:600;fill:var(--mt-purple-text)">Cached</text>
<rect x="355" y="178" width="250" height="88" rx="8" stroke-width="1.5" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<text class="mt-label" x="480.0" y="204" text-anchor="middle">OS page cache</text>
<circle cx="422.0" cy="238" r="7" style="fill:var(--mt-purple)"/>
<circle cx="450.0" cy="230" r="7" style="fill:var(--mt-purple)"/>
<circle cx="466.0" cy="248" r="7" style="fill:var(--mt-purple)"/>
<circle cx="498.0" cy="252" r="7" style="fill:var(--mt-purple)"/>
<circle cx="528.0" cy="240" r="7" style="fill:var(--mt-purple)"/>
<rect x="347.0" y="282" width="122.0" height="34" rx="17.0" style="fill:var(--mt-purple-t)"/><text x="408.0" y="306.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">high RAM</text>
<rect x="479.0" y="282" width="134.0" height="34" rx="17.0" style="fill:var(--mt-purple-t)"/><text x="546.0" y="306.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">evictable</text>
<rect x="650" y="120" width="290" height="216" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-label" x="795.0" y="160" text-anchor="middle" style="font-size:26px;font-weight:600;fill:var(--mt-cyan-text)">Pinned</text>
<rect x="670" y="178" width="250" height="88" rx="8" stroke-width="1.5" style="fill:var(--mt-inset);stroke:var(--mt-cyan)"/>
<text class="mt-label" x="795.0" y="204" text-anchor="middle">Heap</text>
<circle cx="737.0" cy="238" r="7" style="fill:var(--mt-cyan)"/>
<circle cx="765.0" cy="230" r="7" style="fill:var(--mt-cyan)"/>
<circle cx="781.0" cy="248" r="7" style="fill:var(--mt-cyan)"/>
<circle cx="813.0" cy="252" r="7" style="fill:var(--mt-cyan)"/>
<circle cx="843.0" cy="240" r="7" style="fill:var(--mt-cyan)"/>
<rect x="668.0" y="282" width="134.0" height="34" rx="17.0" style="fill:var(--mt-cyan-t)"/><text x="735.0" y="306.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">fixed RAM</text>
<rect x="812.0" y="282" width="110.0" height="34" rx="17.0" style="fill:var(--mt-cyan-t)"/><text x="867.0" y="306.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">fastest</text>
<rect x="20" y="356" width="290" height="48" rx="8" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-label mt-muted" x="165" y="387" text-anchor="middle">Disk</text>
<rect x="335" y="356" width="605" height="48" rx="8" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-label mt-muted" x="637" y="387" text-anchor="middle">RAM</text>
`;

const MOBILE = `
<defs><marker id="mt-arrow-m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--qi-line)"/></marker></defs>
<rect x="24" y="20" width="432" height="76" rx="8" stroke-dasharray="5 4" style="fill:var(--mt-card);stroke:var(--qi-line)"/>
<text class="mt-label" x="240" y="52" text-anchor="middle">Any structure picks</text>
<text class="mt-label" x="240" y="78" text-anchor="middle">a tier, independently</text>
<path d="M34 96 V638" class="mt-axis" stroke-width="2"/>
<path d="M34 214 H44" class="mt-axis" stroke-width="2" marker-end="url(#mt-arrow-m)"/>
<path d="M34 426 H44" class="mt-axis" stroke-width="2" marker-end="url(#mt-arrow-m)"/>
<path d="M34 638 H44" class="mt-axis" stroke-width="2" marker-end="url(#mt-arrow-m)"/>
<rect x="48" y="116" width="408" height="196" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-label" x="68" y="152" style="font-size:25px;font-weight:600;fill:var(--mt-blue-text)">Cold</text>
<text class="mt-note" x="436" y="150" text-anchor="end">on disk</text>
<rect x="68" y="168" width="368" height="88" rx="8" stroke-width="1.5" style="fill:var(--mt-inset);stroke:var(--mt-blue)"/>
<text class="mt-label" x="252.0" y="194" text-anchor="middle">Disk</text>
<circle cx="194.0" cy="228" r="7" style="fill:var(--mt-blue)"/>
<circle cx="222.0" cy="220" r="7" style="fill:var(--mt-blue)"/>
<circle cx="238.0" cy="238" r="7" style="fill:var(--mt-blue)"/>
<circle cx="270.0" cy="242" r="7" style="fill:var(--mt-blue)"/>
<circle cx="300.0" cy="230" r="7" style="fill:var(--mt-blue)"/>
<rect x="137.0" y="272" width="110.0" height="34" rx="17.0" style="fill:var(--mt-blue-t)"/><text x="192.0" y="296.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">low RAM</text>
<rect x="257.0" y="272" width="110.0" height="34" rx="17.0" style="fill:var(--mt-blue-t)"/><text x="312.0" y="296.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">slowest</text>
<rect x="48" y="328" width="408" height="196" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-label" x="68" y="364" style="font-size:25px;font-weight:600;fill:var(--mt-purple-text)">Cached</text>
<text class="mt-note" x="436" y="362" text-anchor="end">in RAM</text>
<rect x="68" y="380" width="368" height="88" rx="8" stroke-width="1.5" style="fill:var(--mt-inset);stroke:var(--mt-purple)"/>
<text class="mt-label" x="252.0" y="406" text-anchor="middle">OS page cache</text>
<circle cx="194.0" cy="440" r="7" style="fill:var(--mt-purple)"/>
<circle cx="222.0" cy="432" r="7" style="fill:var(--mt-purple)"/>
<circle cx="238.0" cy="450" r="7" style="fill:var(--mt-purple)"/>
<circle cx="270.0" cy="454" r="7" style="fill:var(--mt-purple)"/>
<circle cx="300.0" cy="442" r="7" style="fill:var(--mt-purple)"/>
<rect x="119.0" y="484" width="122.0" height="34" rx="17.0" style="fill:var(--mt-purple-t)"/><text x="180.0" y="508.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">high RAM</text>
<rect x="251.0" y="484" width="134.0" height="34" rx="17.0" style="fill:var(--mt-purple-t)"/><text x="318.0" y="508.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">evictable</text>
<rect x="48" y="540" width="408" height="196" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-label" x="68" y="576" style="font-size:25px;font-weight:600;fill:var(--mt-cyan-text)">Pinned</text>
<text class="mt-note" x="436" y="574" text-anchor="end">in RAM</text>
<rect x="68" y="592" width="368" height="88" rx="8" stroke-width="1.5" style="fill:var(--mt-inset);stroke:var(--mt-cyan)"/>
<text class="mt-label" x="252.0" y="618" text-anchor="middle">Heap</text>
<circle cx="194.0" cy="652" r="7" style="fill:var(--mt-cyan)"/>
<circle cx="222.0" cy="644" r="7" style="fill:var(--mt-cyan)"/>
<circle cx="238.0" cy="662" r="7" style="fill:var(--mt-cyan)"/>
<circle cx="270.0" cy="666" r="7" style="fill:var(--mt-cyan)"/>
<circle cx="300.0" cy="654" r="7" style="fill:var(--mt-cyan)"/>
<rect x="125.0" y="696" width="134.0" height="34" rx="17.0" style="fill:var(--mt-cyan-t)"/><text x="192.0" y="720.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">fixed RAM</text>
<rect x="269.0" y="696" width="110.0" height="34" rx="17.0" style="fill:var(--mt-cyan-t)"/><text x="324.0" y="720.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">fastest</text>
`;

function svg(variant, [w, h], body) {
  return `<svg class="qi-svg qi-mt__${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mt');
  node.innerHTML = svg('d', [960, 424], DESKTOP) + svg('m', [480, 756], MOBILE);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
