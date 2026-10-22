/*
 * page-faults island: a static, theme-aware figure for the memory tiers guide
 * (content/documentation/production-operations/memory-tiers.md).
 *
 * No controls. It is an island so the drawing can follow the page theme via
 * the shared --qi-* tokens; index.css maps the figure's own colors for light
 * and dark. Two compositions: the desktop drawing, and a stacked one that
 * index.css swaps in when the figure is narrower than 640px. The fallback
 * PNG in the article is the light desktop drawing.
 */

const LABEL = "Cold tier page faults with and without quantization. A disk page holds only a few full-precision vectors but many compressed vectors. Across one query's graph traversal, the per-hop read cost stays low and even with the compressed copy, and spikes on an uncached, unquantized page miss.";

const DESKTOP = `
<line x1="420" x2="420" y1="32" y2="486" style="stroke:var(--qi-border)"/>
<text class="mt-head" x="40" y="56">Vectors per disk page</text>
<rect x="40" y="110" width="88" height="88" rx="10" style="fill:var(--mt-blue-t)"/>
<rect x="46" y="116" width="34" height="34" rx="4" style="fill:var(--mt-blue)"/>
<rect x="88" y="116" width="34" height="34" rx="4" style="fill:var(--mt-blue)"/>
<rect x="46" y="158" width="34" height="34" rx="4" style="fill:var(--mt-blue)"/>
<rect x="88" y="158" width="34" height="34" rx="4" style="fill:var(--mt-blue)"/>
<rect x="40" y="270" width="88" height="88" rx="10" style="fill:var(--mt-cyan-t)"/>
<rect x="46" y="276" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="66" y="276" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="86" y="276" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="106" y="276" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="46" y="296" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="66" y="296" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="86" y="296" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="106" y="296" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="46" y="316" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="66" y="316" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="86" y="316" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="106" y="316" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="46" y="336" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="66" y="336" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="86" y="336" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="106" y="336" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<text class="mt-head" x="146" y="128">Full precision, cold</text>
<text class="mt-small mt-muted" x="146" y="156">A page holds only a</text>
<text class="mt-small mt-muted" x="146" y="180">few full vectors, so</text>
<text class="mt-small mt-muted" x="146" y="204">most candidates need</text>
<text class="mt-small mt-muted" x="146" y="228">their own disk read.</text>
<text class="mt-head" x="146" y="288">Compressed copy</text>
<text class="mt-small mt-muted" x="146" y="316">The same page holds</text>
<text class="mt-small mt-muted" x="146" y="340">many compressed</text>
<text class="mt-small mt-muted" x="146" y="364">vectors, so one read</text>
<text class="mt-small mt-muted" x="146" y="388">serves far more</text>
<text class="mt-small mt-muted" x="146" y="412">candidates.</text>
<text class="mt-head" x="444" y="56">Read cost across one query's</text>
<text class="mt-head" x="444" y="82">graph traversal</text>
<text class="mt-note" x="444" y="108">conceptual, not to scale</text>
<rect x="444" y="129" width="16" height="16" rx="2" style="fill:var(--mt-blue)"/><text class="mt-note" x="470" y="144" style="fill:var(--qi-fg)">full precision, cold</text>
<rect x="716" y="129" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/><text class="mt-note" x="742" y="144" style="fill:var(--qi-fg)">compressed copy</text>
<rect x="452" y="399" width="22" height="31" rx="2" style="fill:var(--mt-blue)"/>
<rect x="478" y="410" width="22" height="20" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="512" y="383" width="22" height="47" rx="2" style="fill:var(--mt-blue)"/>
<rect x="538" y="407" width="22" height="23" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="572" y="404" width="22" height="26" rx="2" style="fill:var(--mt-blue)"/>
<rect x="598" y="412" width="22" height="18" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="632" y="391" width="22" height="39" rx="2" style="fill:var(--mt-blue)"/>
<rect x="658" y="410" width="22" height="20" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="692" y="396" width="22" height="34" rx="2" style="fill:var(--mt-blue)"/>
<rect x="718" y="407" width="22" height="23" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="752" y="378" width="22" height="52" rx="2" style="fill:var(--mt-blue)"/>
<rect x="778" y="412" width="22" height="18" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="812" y="190" width="22" height="240" rx="2" style="fill:var(--mt-blue)"/>
<rect x="838" y="404" width="22" height="26" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="872" y="394" width="22" height="36" rx="2" style="fill:var(--mt-blue)"/>
<rect x="898" y="410" width="22" height="20" rx="2" style="fill:var(--mt-cyan)"/>
<line x1="774" x2="806" y1="198" y2="198" stroke-width="1.5" style="stroke:var(--mt-red)"/>
<text class="mt-note" x="768" y="204" text-anchor="end" style="fill:var(--mt-red-ink)">a page miss, uncached</text>
<text class="mt-note" x="768" y="228" text-anchor="end" style="fill:var(--mt-red-ink)">and unquantized</text>
<path d="M444 170 V430 H940" class="mt-axis"/>
<text class="mt-note" x="444" y="456">query start</text>
<text class="mt-note" x="940" y="456" text-anchor="end">query result</text>
<text class="mt-note" x="692" y="484" text-anchor="middle">graph traversal, hop by hop →</text>
`;

const MOBILE = `
<text class="mt-head" x="24" y="44">Vectors per disk page</text>
<rect x="24" y="72" width="88" height="88" rx="10" style="fill:var(--mt-blue-t)"/>
<rect x="30" y="78" width="34" height="34" rx="4" style="fill:var(--mt-blue)"/>
<rect x="72" y="78" width="34" height="34" rx="4" style="fill:var(--mt-blue)"/>
<rect x="30" y="120" width="34" height="34" rx="4" style="fill:var(--mt-blue)"/>
<rect x="72" y="120" width="34" height="34" rx="4" style="fill:var(--mt-blue)"/>
<rect x="24" y="222" width="88" height="88" rx="10" style="fill:var(--mt-cyan-t)"/>
<rect x="30" y="228" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="50" y="228" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="70" y="228" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="90" y="228" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="30" y="248" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="50" y="248" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="70" y="248" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="90" y="248" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="30" y="268" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="50" y="268" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="70" y="268" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="90" y="268" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="30" y="288" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="50" y="288" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="70" y="288" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="90" y="288" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/>
<text class="mt-head" x="130" y="90">Full precision, cold</text>
<text class="mt-small mt-muted" x="130" y="118">A page holds only a few</text>
<text class="mt-small mt-muted" x="130" y="142">full vectors, so most</text>
<text class="mt-small mt-muted" x="130" y="166">candidates need their</text>
<text class="mt-small mt-muted" x="130" y="190">own disk read.</text>
<text class="mt-head" x="130" y="240">Compressed copy</text>
<text class="mt-small mt-muted" x="130" y="268">The same page holds many</text>
<text class="mt-small mt-muted" x="130" y="292">compressed vectors, so</text>
<text class="mt-small mt-muted" x="130" y="316">one read serves far</text>
<text class="mt-small mt-muted" x="130" y="340">more candidates.</text>
<line x1="24" x2="456" y1="376" y2="376" style="stroke:var(--qi-border)"/>
<text class="mt-head" x="24" y="414">Read cost across one</text>
<text class="mt-head" x="24" y="440">query's graph traversal</text>
<text class="mt-note" x="24" y="466">conceptual, not to scale</text>
<rect x="24" y="487" width="16" height="16" rx="2" style="fill:var(--mt-blue)"/><text class="mt-note" x="50" y="502" style="fill:var(--qi-fg)">full precision, cold</text>
<rect x="24" y="515" width="16" height="16" rx="2" style="fill:var(--mt-cyan)"/><text class="mt-note" x="50" y="530" style="fill:var(--qi-fg)">compressed copy</text>
<rect x="30" y="779" width="20" height="31" rx="2" style="fill:var(--mt-blue)"/>
<rect x="54" y="790" width="20" height="20" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="84" y="763" width="20" height="47" rx="2" style="fill:var(--mt-blue)"/>
<rect x="108" y="787" width="20" height="23" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="138" y="784" width="20" height="26" rx="2" style="fill:var(--mt-blue)"/>
<rect x="162" y="792" width="20" height="18" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="192" y="771" width="20" height="39" rx="2" style="fill:var(--mt-blue)"/>
<rect x="216" y="790" width="20" height="20" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="246" y="776" width="20" height="34" rx="2" style="fill:var(--mt-blue)"/>
<rect x="270" y="787" width="20" height="23" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="300" y="758" width="20" height="52" rx="2" style="fill:var(--mt-blue)"/>
<rect x="324" y="792" width="20" height="18" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="354" y="570" width="20" height="240" rx="2" style="fill:var(--mt-blue)"/>
<rect x="378" y="784" width="20" height="26" rx="2" style="fill:var(--mt-cyan)"/>
<rect x="408" y="774" width="20" height="36" rx="2" style="fill:var(--mt-blue)"/>
<rect x="432" y="790" width="20" height="20" rx="2" style="fill:var(--mt-cyan)"/>
<line x1="324" x2="350" y1="578" y2="578" stroke-width="1.5" style="stroke:var(--mt-red)"/>
<text class="mt-note" x="318" y="584" text-anchor="end" style="fill:var(--mt-red-ink)">a page miss, uncached</text>
<text class="mt-note" x="318" y="608" text-anchor="end" style="fill:var(--mt-red-ink)">and unquantized</text>
<path d="M24 560 V810 H456" class="mt-axis"/>
<text class="mt-note" x="24" y="836">query start</text>
<text class="mt-note" x="456" y="836" text-anchor="end">query result</text>
<text class="mt-note" x="240" y="864" text-anchor="middle">graph traversal, hop by hop →</text>
`;

function svg(variant, [w, h], body) {
  return `<svg class="qi-svg qi-mt__${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mt');
  node.innerHTML = svg('d', [960, 510], DESKTOP) + svg('m', [480, 890], MOBILE);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
