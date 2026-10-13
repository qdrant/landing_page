/*
 * tradeoffs island: a static, theme-aware figure for the memory tiers guide
 * (content/documentation/production-operations/memory-tiers.md).
 *
 * No controls. It is an island so the drawing can follow the page theme via
 * the shared --qi-* tokens; index.css maps the figure's own colors for light
 * and dark. Two compositions: the desktop drawing, and a stacked one that
 * index.css swaps in when the figure is narrower than 640px. The fallback
 * PNG in the article is the light desktop drawing.
 */

const LABEL = "Trade-offs, on paper, for five memory configurations. Full Cached, No Quantization: fast, high footprint, opportunistic cost. Full Cached, With Quantization: fast, high, opportunistic. Full Cold, No Quantization: slow and unpredictable, low, opportunistic. Full Cold, With Quantization: moderate, moderate, opportunistic. Pinned Quantized Vectors: fast, moderate, fixed.";

const DESKTOP = `
<text class="mt-note" x="32" y="74" style="letter-spacing:0.5px">LAYOUT</text>
<text class="mt-note" x="290" y="74" style="letter-spacing:0.5px">EXPECTED SPEED</text>
<text class="mt-note" x="566" y="62" style="letter-spacing:0.5px">EXPECTED MEMORY</text>
<text class="mt-note" x="566" y="86" style="letter-spacing:0.5px">FOOTPRINT</text>
<text class="mt-note" x="756" y="74" style="letter-spacing:0.5px">MEMORY COST</text>
<line x1="24" x2="936" y1="100" y2="100" style="stroke:var(--qi-border)"/>
<text class="mt-label" x="32" y="136">Full Cached,</text>
<text class="mt-label" x="32" y="162">No Quantization</text>
<rect x="290.0" y="123" width="74.0" height="34" rx="17.0" style="fill:var(--mt-cyan-t)"/><text x="327.0" y="147.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-cyan-ink)">Fast</text>
<rect x="566.0" y="123" width="74.0" height="34" rx="17.0" style="fill:var(--mt-red-t)"/><text x="603.0" y="147.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-red-ink)">High</text>
<rect x="756.0" y="123" width="182.0" height="34" rx="17.0" style="fill:var(--mt-card);stroke:var(--qi-line)"/><text x="847.0" y="147.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">Opportunistic</text>
<line x1="24" x2="936" y1="180" y2="180" style="stroke:var(--qi-border)"/>
<text class="mt-label" x="32" y="216">Full Cached,</text>
<text class="mt-label" x="32" y="242">With Quantization</text>
<rect x="290.0" y="203" width="74.0" height="34" rx="17.0" style="fill:var(--mt-cyan-t)"/><text x="327.0" y="227.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-cyan-ink)">Fast</text>
<rect x="566.0" y="203" width="74.0" height="34" rx="17.0" style="fill:var(--mt-red-t)"/><text x="603.0" y="227.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-red-ink)">High</text>
<rect x="756.0" y="203" width="182.0" height="34" rx="17.0" style="fill:var(--mt-card);stroke:var(--qi-line)"/><text x="847.0" y="227.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">Opportunistic</text>
<line x1="24" x2="936" y1="260" y2="260" style="stroke:var(--qi-border)"/>
<text class="mt-label" x="32" y="296">Full Cold,</text>
<text class="mt-label" x="32" y="322">No Quantization</text>
<rect x="290.0" y="283" width="254.0" height="34" rx="17.0" style="fill:var(--mt-red-t)"/><text x="417.0" y="307.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-red-ink)">Slow, unpredictable</text>
<rect x="566.0" y="283" width="62.0" height="34" rx="17.0" style="fill:var(--mt-cyan-t)"/><text x="597.0" y="307.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-cyan-ink)">Low</text>
<rect x="756.0" y="283" width="182.0" height="34" rx="17.0" style="fill:var(--mt-card);stroke:var(--qi-line)"/><text x="847.0" y="307.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">Opportunistic</text>
<line x1="24" x2="936" y1="340" y2="340" style="stroke:var(--qi-border)"/>
<text class="mt-label" x="32" y="376">Full Cold,</text>
<text class="mt-label" x="32" y="402">With Quantization</text>
<rect x="290.0" y="363" width="122.0" height="34" rx="17.0" style="fill:var(--mt-orange-t)"/><text x="351.0" y="387.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-orange-ink)">Moderate</text>
<rect x="566.0" y="363" width="122.0" height="34" rx="17.0" style="fill:var(--mt-orange-t)"/><text x="627.0" y="387.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-orange-ink)">Moderate</text>
<rect x="756.0" y="363" width="182.0" height="34" rx="17.0" style="fill:var(--mt-card);stroke:var(--qi-line)"/><text x="847.0" y="387.0" text-anchor="middle" style="font-size:20px;fill:var(--qi-fg)">Opportunistic</text>
<line x1="24" x2="936" y1="420" y2="420" style="stroke:var(--qi-border)"/>
<text class="mt-label" x="32" y="456">Pinned Quantized</text>
<text class="mt-label" x="32" y="482">Vectors</text>
<rect x="290.0" y="443" width="74.0" height="34" rx="17.0" style="fill:var(--mt-cyan-t)"/><text x="327.0" y="467.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-cyan-ink)">Fast</text>
<rect x="566.0" y="443" width="122.0" height="34" rx="17.0" style="fill:var(--mt-orange-t)"/><text x="627.0" y="467.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-orange-ink)">Moderate</text>
<rect x="756.0" y="443" width="86.0" height="34" rx="17.0" style="fill:var(--mt-blue-t)"/><text x="799.0" y="467.0" text-anchor="middle" style="font-size:20px;fill:var(--mt-blue-ink)">Fixed</text>
`;

const MOBILE = `
<rect x="24" y="24" width="432" height="182" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-head" x="44" y="60">Full Cached, No Quantization</text>
<text class="mt-note" x="44" y="101">speed</text>
<rect x="186.0" y="78" width="71.6" height="32" rx="16.0" style="fill:var(--mt-cyan-t)"/><text x="221.8" y="100.7" text-anchor="middle" style="font-size:19px;fill:var(--mt-cyan-ink)">Fast</text>
<text class="mt-note" x="44" y="143">footprint</text>
<rect x="186.0" y="120" width="71.6" height="32" rx="16.0" style="fill:var(--mt-red-t)"/><text x="221.8" y="142.7" text-anchor="middle" style="font-size:19px;fill:var(--mt-red-ink)">High</text>
<text class="mt-note" x="44" y="185">memory cost</text>
<rect x="186.0" y="162" width="174.2" height="32" rx="16.0" style="fill:var(--mt-card);stroke:var(--qi-line)"/><text x="273.1" y="184.7" text-anchor="middle" style="font-size:19px;fill:var(--qi-fg)">Opportunistic</text>
<rect x="24" y="220" width="432" height="182" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-head" x="44" y="256">Full Cached, With Quantization</text>
<text class="mt-note" x="44" y="297">speed</text>
<rect x="186.0" y="274" width="71.6" height="32" rx="16.0" style="fill:var(--mt-cyan-t)"/><text x="221.8" y="296.6" text-anchor="middle" style="font-size:19px;fill:var(--mt-cyan-ink)">Fast</text>
<text class="mt-note" x="44" y="339">footprint</text>
<rect x="186.0" y="316" width="71.6" height="32" rx="16.0" style="fill:var(--mt-red-t)"/><text x="221.8" y="338.6" text-anchor="middle" style="font-size:19px;fill:var(--mt-red-ink)">High</text>
<text class="mt-note" x="44" y="381">memory cost</text>
<rect x="186.0" y="358" width="174.2" height="32" rx="16.0" style="fill:var(--mt-card);stroke:var(--qi-line)"/><text x="273.1" y="380.6" text-anchor="middle" style="font-size:19px;fill:var(--qi-fg)">Opportunistic</text>
<rect x="24" y="416" width="432" height="182" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-head" x="44" y="452">Full Cold, No Quantization</text>
<text class="mt-note" x="44" y="493">speed</text>
<rect x="186.0" y="470" width="242.6" height="32" rx="16.0" style="fill:var(--mt-red-t)"/><text x="307.3" y="492.6" text-anchor="middle" style="font-size:19px;fill:var(--mt-red-ink)">Slow, unpredictable</text>
<text class="mt-note" x="44" y="535">footprint</text>
<rect x="186.0" y="512" width="60.2" height="32" rx="16.0" style="fill:var(--mt-cyan-t)"/><text x="216.1" y="534.6" text-anchor="middle" style="font-size:19px;fill:var(--mt-cyan-ink)">Low</text>
<text class="mt-note" x="44" y="577">memory cost</text>
<rect x="186.0" y="554" width="174.2" height="32" rx="16.0" style="fill:var(--mt-card);stroke:var(--qi-line)"/><text x="273.1" y="576.6" text-anchor="middle" style="font-size:19px;fill:var(--qi-fg)">Opportunistic</text>
<rect x="24" y="612" width="432" height="182" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-head" x="44" y="648">Full Cold, With Quantization</text>
<text class="mt-note" x="44" y="689">speed</text>
<rect x="186.0" y="666" width="117.2" height="32" rx="16.0" style="fill:var(--mt-orange-t)"/><text x="244.6" y="688.6" text-anchor="middle" style="font-size:19px;fill:var(--mt-orange-ink)">Moderate</text>
<text class="mt-note" x="44" y="731">footprint</text>
<rect x="186.0" y="708" width="117.2" height="32" rx="16.0" style="fill:var(--mt-orange-t)"/><text x="244.6" y="730.6" text-anchor="middle" style="font-size:19px;fill:var(--mt-orange-ink)">Moderate</text>
<text class="mt-note" x="44" y="773">memory cost</text>
<rect x="186.0" y="750" width="174.2" height="32" rx="16.0" style="fill:var(--mt-card);stroke:var(--qi-line)"/><text x="273.1" y="772.6" text-anchor="middle" style="font-size:19px;fill:var(--qi-fg)">Opportunistic</text>
<rect x="24" y="808" width="432" height="182" rx="10" style="fill:var(--mt-card);stroke:var(--qi-border)"/>
<text class="mt-head" x="44" y="844">Pinned Quantized Vectors</text>
<text class="mt-note" x="44" y="885">speed</text>
<rect x="186.0" y="862" width="71.6" height="32" rx="16.0" style="fill:var(--mt-cyan-t)"/><text x="221.8" y="884.6" text-anchor="middle" style="font-size:19px;fill:var(--mt-cyan-ink)">Fast</text>
<text class="mt-note" x="44" y="927">footprint</text>
<rect x="186.0" y="904" width="117.2" height="32" rx="16.0" style="fill:var(--mt-orange-t)"/><text x="244.6" y="926.6" text-anchor="middle" style="font-size:19px;fill:var(--mt-orange-ink)">Moderate</text>
<text class="mt-note" x="44" y="969">memory cost</text>
<rect x="186.0" y="946" width="83.0" height="32" rx="16.0" style="fill:var(--mt-blue-t)"/><text x="227.5" y="968.6" text-anchor="middle" style="font-size:19px;fill:var(--mt-blue-ink)">Fixed</text>
`;

function svg(variant, [w, h], body) {
  return `<svg class="qi-svg qi-mt__${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mt');
  node.innerHTML = svg('d', [960, 520], DESKTOP) + svg('m', [480, 1014], MOBILE);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
