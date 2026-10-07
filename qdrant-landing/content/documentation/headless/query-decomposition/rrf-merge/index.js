export function mount(node) {
  node.classList.add("qi-rrf");
  node.innerHTML = `
<svg aria-label="RRF merges ranked chunks C, A, E, B." class="qi-svg rrf-desktop" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 240">

  <text x="136" y="30">Hop 1</text>
  <text x="360" y="30">Hop 2</text>
  <text x="584" y="30">Merged</text>
  <path class="connector" d="M214 154H235.2Q241.2 154 241.2 160V220Q241.2 226 247.2 226H478.24Q484.24 226 484.24 220V72Q484.24 66 490.24 66H506"/>
  <path class="connector" d="M438 110H455.12Q461.12 110 461.12 104V72Q461.12 66 467.12 66H506"/>
  <g id="rrf-merge-desktop-hop1-1" transform="translate(58 50)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:#ffffff">A 0.500</text>
  </g>
  <g id="rrf-merge-desktop-hop1-2" transform="translate(58 94)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:var(--rrf-ink)">B 0.333</text>
  </g>
  <g id="rrf-merge-desktop-hop1-3" transform="translate(58 138)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:var(--rrf-ink)">C 0.250</text>
  </g>
  <g id="rrf-merge-desktop-hop1-4" transform="translate(58 182)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-min)"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:var(--rrf-ink)">D 0.200</text>
  </g>
  <g id="rrf-merge-desktop-hop2-1" transform="translate(282 50)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:#ffffff">E 0.500</text>
  </g>
  <g id="rrf-merge-desktop-hop2-2" transform="translate(282 94)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:var(--rrf-ink)">C 0.333</text>
  </g>
  <g id="rrf-merge-desktop-hop2-3" transform="translate(282 138)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:var(--rrf-ink)">F 0.250</text>
  </g>
  <g id="rrf-merge-desktop-hop2-4" transform="translate(282 182)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-min)"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:var(--rrf-ink)">G 0.200</text>
  </g>
  <g id="rrf-merge-desktop-merged-1" transform="translate(506 50)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#4325ae"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:#ffffff">C 0.583</text>
  </g>
  <g id="rrf-merge-desktop-merged-2" transform="translate(506 94)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:#ffffff">A 0.500</text>
  </g>
  <g id="rrf-merge-desktop-merged-3" transform="translate(506 138)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:#ffffff">E 0.500</text>
  </g>
  <g id="rrf-merge-desktop-merged-4" transform="translate(506 182)">
    <rect width="156" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="78" y="21" style="font-size:14px;fill:var(--rrf-ink)">B 0.333</text>
  </g>
</svg>
<svg aria-label="RRF merges ranked chunks C, A, E, B." class="qi-svg rrf-mobile" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 240">

  <text x="56" y="30">Hop 1</text>
  <text x="190" y="30">Hop 2</text>
  <text x="329" y="30">Merged</text>
  <path class="connector" d="M100 154H112.4Q118.4 154 118.4 160V220Q118.4 226 124.4 226H259.28Q265.28 226 265.28 220V72Q265.28 66 271.28 66H280"/>
  <path class="connector" d="M234 110H243.64Q249.64 110 249.64 104V72Q249.64 66 255.64 66H280"/>
  <g id="rrf-merge-mobile-hop1-1" transform="translate(12 50)">
    <rect width="88" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="21" style="font-size:14px;fill:#ffffff">A 0.500</text>
  </g>
  <g id="rrf-merge-mobile-hop1-2" transform="translate(12 94)">
    <rect width="88" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="44" y="21" style="font-size:14px;fill:var(--rrf-ink)">B 0.333</text>
  </g>
  <g id="rrf-merge-mobile-hop1-3" transform="translate(12 138)">
    <rect width="88" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="44" y="21" style="font-size:14px;fill:var(--rrf-ink)">C 0.250</text>
  </g>
  <g id="rrf-merge-mobile-hop1-4" transform="translate(12 182)">
    <rect width="88" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-min)"/>
    <text class="tile-label" x="44" y="21" style="font-size:14px;fill:var(--rrf-ink)">D 0.200</text>
  </g>
  <g id="rrf-merge-mobile-hop2-1" transform="translate(146 50)">
    <rect width="88" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="21" style="font-size:14px;fill:#ffffff">E 0.500</text>
  </g>
  <g id="rrf-merge-mobile-hop2-2" transform="translate(146 94)">
    <rect width="88" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="44" y="21" style="font-size:14px;fill:var(--rrf-ink)">C 0.333</text>
  </g>
  <g id="rrf-merge-mobile-hop2-3" transform="translate(146 138)">
    <rect width="88" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="44" y="21" style="font-size:14px;fill:var(--rrf-ink)">F 0.250</text>
  </g>
  <g id="rrf-merge-mobile-hop2-4" transform="translate(146 182)">
    <rect width="88" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-min)"/>
    <text class="tile-label" x="44" y="21" style="font-size:14px;fill:var(--rrf-ink)">G 0.200</text>
  </g>
  <g id="rrf-merge-mobile-merged-1" transform="translate(280 50)">
    <rect width="98" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#4325ae"/>
    <text class="tile-label" x="49" y="21" style="font-size:14px;fill:#ffffff">C 0.583</text>
  </g>
  <g id="rrf-merge-mobile-merged-2" transform="translate(280 94)">
    <rect width="98" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="49" y="21" style="font-size:14px;fill:#ffffff">A 0.500</text>
  </g>
  <g id="rrf-merge-mobile-merged-3" transform="translate(280 138)">
    <rect width="98" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="49" y="21" style="font-size:14px;fill:#ffffff">E 0.500</text>
  </g>
  <g id="rrf-merge-mobile-merged-4" transform="translate(280 182)">
    <rect width="98" height="32" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="49" y="21" style="font-size:14px;fill:var(--rrf-ink)">B 0.333</text>
  </g>
</svg>
`;
  node.dispatchEvent(new CustomEvent("island:ready", { bubbles: true }));
}
