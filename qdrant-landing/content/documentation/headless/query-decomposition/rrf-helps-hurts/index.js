export function mount(node) {
  node.classList.add("qi-rrf");
  node.innerHTML = `
<svg aria-label="RRF keeps needed chunks in Helps; repeated vague chunk E displaces C in Hurts." class="qi-svg rrf-desktop" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 240">
  
  <path class="cutoff" d="M360 16V224" opacity="0.18"/>
  <g id="rrf-helps-hurts-desktop-helps" transform="translate(0 0)">
  <text class="panel-title" x="176" y="26">Helps</text>
  <text x="61" y="60">Hop 1</text>
  <text x="167" y="60">Hop 2</text>
  <text x="286" y="60">Merged</text>
  <path class="connector" d="M100 193H105.2Q111.2 193 111.2 199V220Q111.2 226 117.2 226H224.48Q230.48 226 230.48 220V99Q230.48 93 236.48 93H242"/>
  <path class="connector" d="M206 143H212.24Q218.24 143 218.24 137V99Q218.24 93 224.24 93H242"/>
  <path class="cutoff" d="M236 168H336"/>
  <g id="rrf-helps-hurts-desktop-helps-hop1-1" transform="translate(22 78)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:#ffffff">A 0.500</text>
    <g transform="translate(69 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-desktop-helps-hop1-2" transform="translate(22 128)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:var(--rrf-ink)">D 0.333</text>
  </g>
  <g id="rrf-helps-hurts-desktop-helps-hop1-3" transform="translate(22 178)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:var(--rrf-ink)">C 0.250</text>
    <g transform="translate(69 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-desktop-helps-hop2-1" transform="translate(128 78)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:#ffffff">B 0.500</text>
    <g transform="translate(69 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-2.5-2.5L2.5 2.5M-2.5 2.5L2.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-desktop-helps-hop2-2" transform="translate(128 128)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:var(--rrf-ink)">C 0.333</text>
    <g transform="translate(69 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-desktop-helps-hop2-3" transform="translate(128 178)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:var(--rrf-ink)">F 0.250</text>
  </g>
  <g id="rrf-helps-hurts-desktop-helps-merged-1" transform="translate(242 78)">
    <rect width="88" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#4325ae"/>
    <text class="tile-label" x="44" y="20" style="font-size:14px;fill:#ffffff">C 0.583</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-desktop-helps-merged-2" transform="translate(242 128)">
    <rect width="88" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="20" style="font-size:14px;fill:#ffffff">A 0.500</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-desktop-helps-merged-3" transform="translate(242 178)">
    <rect width="88" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="20" style="font-size:14px;fill:#ffffff">B 0.500</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-2.5-2.5L2.5 2.5M-2.5 2.5L2.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  </g>
  <g id="rrf-helps-hurts-desktop-hurts" transform="translate(360 0)">
  <text class="panel-title" x="176" y="26">Hurts</text>
  <text x="61" y="60">Hop 1</text>
  <text x="167" y="60">Hop 2</text>
  <text x="286" y="60">Merged</text>
  <path class="connector" d="M100 193H105.2Q111.2 193 111.2 199V220Q111.2 226 117.2 226H224.48Q230.48 226 230.48 220V99Q230.48 93 236.48 93H242"/>
  <path class="connector" d="M206 143H212.24Q218.24 143 218.24 137V99Q218.24 93 224.24 93H242"/>
  <path class="cutoff" d="M236 168H336"/>
  <g id="rrf-helps-hurts-desktop-hurts-hop1-1" transform="translate(22 78)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:#ffffff">A 0.500</text>
    <g transform="translate(69 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-desktop-hurts-hop1-2" transform="translate(22 128)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:var(--rrf-ink)">D 0.333</text>
  </g>
  <g id="rrf-helps-hurts-desktop-hurts-hop1-3" transform="translate(22 178)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:var(--rrf-ink)">E 0.250</text>
    <rect class="vague" x="-2" y="-2" width="82" height="34" rx="9"/>
  </g>
  <g id="rrf-helps-hurts-desktop-hurts-hop2-1" transform="translate(128 78)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:#ffffff">C 0.500</text>
    <g transform="translate(69 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-desktop-hurts-hop2-2" transform="translate(128 128)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:var(--rrf-ink)">E 0.333</text>
    <rect class="vague" x="-2" y="-2" width="82" height="34" rx="9"/>
  </g>
  <g id="rrf-helps-hurts-desktop-hurts-hop2-3" transform="translate(128 178)">
    <rect width="78" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="39" y="23" style="font-size:12px;fill:var(--rrf-ink)">G 0.250</text>
  </g>
  <g id="rrf-helps-hurts-desktop-hurts-merged-1" transform="translate(242 78)">
    <rect width="88" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#4325ae"/>
    <text class="tile-label" x="44" y="20" style="font-size:14px;fill:#ffffff">E 0.583</text>
    <rect class="vague" x="-2" y="-2" width="92" height="34" rx="9"/>
  </g>
  <g id="rrf-helps-hurts-desktop-hurts-merged-2" transform="translate(242 128)">
    <rect width="88" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="20" style="font-size:14px;fill:#ffffff">A 0.500</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-desktop-hurts-merged-3" transform="translate(242 178)">
    <rect width="88" height="30" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="20" style="font-size:14px;fill:#ffffff">C 0.500</text>
    <g transform="translate(9 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-2.5-2.5L2.5 2.5M-2.5 2.5L2.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  </g>
</svg>
<svg aria-label="RRF keeps needed chunks in Helps; repeated vague chunk E displaces C in Hurts." class="qi-svg rrf-mobile" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 406">
  
  <g id="rrf-helps-hurts-mobile-helps" transform="translate(0 0)">
  <text class="panel-title" x="195" y="26">Helps</text>
  <text x="56" y="52">Hop 1</text>
  <text x="190" y="52">Hop 2</text>
  <text x="329" y="52">Merged</text>
  <path class="connector" d="M100 158H112.4Q118.4 158 118.4 164V182Q118.4 188 124.4 188H259.28Q265.28 188 265.28 182V84Q265.28 78 271.28 78H280"/>
  <path class="connector" d="M234 118H243.64Q249.64 118 249.64 112V84Q249.64 78 255.64 78H280"/>
  <path class="cutoff" d="M274 138H384"/>
  <g id="rrf-helps-hurts-mobile-helps-hop1-1" transform="translate(12 64)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:#ffffff">A 0.500</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-mobile-helps-hop1-2" transform="translate(12 104)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:var(--rrf-ink)">D 0.333</text>
  </g>
  <g id="rrf-helps-hurts-mobile-helps-hop1-3" transform="translate(12 144)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:var(--rrf-ink)">C 0.250</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-mobile-helps-hop2-1" transform="translate(146 64)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:#ffffff">B 0.500</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-2.5-2.5L2.5 2.5M-2.5 2.5L2.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-mobile-helps-hop2-2" transform="translate(146 104)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:var(--rrf-ink)">C 0.333</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-mobile-helps-hop2-3" transform="translate(146 144)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:var(--rrf-ink)">F 0.250</text>
  </g>
  <g id="rrf-helps-hurts-mobile-helps-merged-1" transform="translate(280 64)">
    <rect width="98" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#4325ae"/>
    <text class="tile-label" x="49" y="19" style="font-size:14px;fill:#ffffff">C 0.583</text>
    <g transform="translate(89 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-mobile-helps-merged-2" transform="translate(280 104)">
    <rect width="98" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="49" y="19" style="font-size:14px;fill:#ffffff">A 0.500</text>
    <g transform="translate(89 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-mobile-helps-merged-3" transform="translate(280 144)">
    <rect width="98" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="49" y="19" style="font-size:14px;fill:#ffffff">B 0.500</text>
    <g transform="translate(89 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-2.5-2.5L2.5 2.5M-2.5 2.5L2.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  </g>
  <g id="rrf-helps-hurts-mobile-hurts" transform="translate(0 206)">
  <text class="panel-title" x="195" y="26">Hurts</text>
  <text x="56" y="52">Hop 1</text>
  <text x="190" y="52">Hop 2</text>
  <text x="329" y="52">Merged</text>
  <path class="connector" d="M100 158H112.4Q118.4 158 118.4 164V182Q118.4 188 124.4 188H259.28Q265.28 188 265.28 182V84Q265.28 78 271.28 78H280"/>
  <path class="connector" d="M234 118H243.64Q249.64 118 249.64 112V84Q249.64 78 255.64 78H280"/>
  <path class="cutoff" d="M274 138H384"/>
  <g id="rrf-helps-hurts-mobile-hurts-hop1-1" transform="translate(12 64)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:#ffffff">A 0.500</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-mobile-hurts-hop1-2" transform="translate(12 104)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:var(--rrf-ink)">D 0.333</text>
  </g>
  <g id="rrf-helps-hurts-mobile-hurts-hop1-3" transform="translate(12 144)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:var(--rrf-ink)">E 0.250</text>
    <rect class="vague" x="-2" y="-2" width="92" height="32" rx="9"/>
  </g>
  <g id="rrf-helps-hurts-mobile-hurts-hop2-1" transform="translate(146 64)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:#ffffff">C 0.500</text>
    <g transform="translate(79 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-mobile-hurts-hop2-2" transform="translate(146 104)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-mid)"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:var(--rrf-ink)">E 0.333</text>
    <rect class="vague" x="-2" y="-2" width="92" height="32" rx="9"/>
  </g>
  <g id="rrf-helps-hurts-mobile-hurts-hop2-3" transform="translate(146 144)">
    <rect width="88" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="var(--rrf-low)"/>
    <text class="tile-label" x="44" y="19" style="font-size:14px;fill:var(--rrf-ink)">G 0.250</text>
  </g>
  <g id="rrf-helps-hurts-mobile-hurts-merged-1" transform="translate(280 64)">
    <rect width="98" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#4325ae"/>
    <text class="tile-label" x="49" y="19" style="font-size:14px;fill:#ffffff">E 0.583</text>
    <rect class="vague" x="-2" y="-2" width="102" height="32" rx="9"/>
  </g>
  <g id="rrf-helps-hurts-mobile-hurts-merged-2" transform="translate(280 104)">
    <rect width="98" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="49" y="19" style="font-size:14px;fill:#ffffff">A 0.500</text>
    <g transform="translate(89 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <g id="rrf-helps-hurts-mobile-hurts-merged-3" transform="translate(280 144)">
    <rect width="98" height="28" rx="6" stroke="var(--qi-muted)" stroke-width="1" fill="#6047ff"/>
    <text class="tile-label" x="49" y="19" style="font-size:14px;fill:#ffffff">C 0.500</text>
    <g transform="translate(9 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-2.5-2.5L2.5 2.5M-2.5 2.5L2.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(89 7)">
      <circle r="5" fill="#ffffff"/>
      <path d="M-3 0L-0.7 2.5L3.5-2.5" fill="none" stroke="#211650" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  </g>
</svg>
`;
  node.dispatchEvent(new CustomEvent("island:ready", { bubbles: true }));
}
