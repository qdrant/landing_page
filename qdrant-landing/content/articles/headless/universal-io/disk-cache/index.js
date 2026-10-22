let instanceId = 0;

export function mount(node) {
  node.classList.add('uio-cache');
  const id = ++instanceId;
  const wideArrow = `uio-cache-arrow-wide-${id}`;
  const compactArrow = `uio-cache-arrow-compact-${id}`;
  const defs = (arrowId) => `<defs><marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="uio-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>`;

  node.innerHTML = `
    <div class="qi-fig">
      <svg class="qi-svg uio-wide" viewBox="0 0 760 278" role="img" aria-label="DiskCache has three read paths. A cache hit reads the local mmap immediately. A miss fetches the missing range and writes it to the mmap. A read already covered by an in-flight fetch waits for that fetch. Every path returns a borrowed slice from the local mmap.">
        ${defs(wideArrow)}
        <text class="qi-title uio-heading" x="380" y="24" text-anchor="middle">Every path returns a local mmap slice</text>
        <text class="qi-label" x="380" y="46" text-anchor="middle">the bitmap tracks which 16 KiB blocks are already local</text>

        <text class="uio-row-title is-hit" x="28" y="89">HIT</text>
        <g class="uio-bits" transform="translate(112 70)"><rect x="0"/><rect x="24"/><rect x="48"/><text x="8" y="17">1</text><text x="32" y="17">1</text><text x="56" y="17">1</text></g>
        <text class="qi-label" x="112" y="111">all blocks local</text>
        <path class="uio-flow" d="M196 84H288" marker-end="url(#${wideArrow})"/>
        <g class="uio-mmap" transform="translate(306 67)"><rect width="174" height="34" rx="5"/><text x="87" y="22" text-anchor="middle">local mmap</text></g>
        <path class="uio-flow" d="M480 84H570" marker-end="url(#${wideArrow})"/>
        <text class="qi-label qi-label--strong" x="588" y="89">borrowed slice</text>

        <line class="uio-divider" x1="20" y1="126" x2="740" y2="126"/>
        <text class="uio-row-title is-miss" x="28" y="159">MISS</text>
        <g class="uio-bits" transform="translate(112 140)"><rect x="0"/><rect class="is-missing" x="24"/><rect class="is-missing" x="48"/><text x="8" y="17">1</text><text x="32" y="17">0</text><text x="56" y="17">0</text></g>
        <text class="qi-label" x="112" y="181">some blocks missing</text>
        <path class="uio-flow" d="M196 154H252" marker-end="url(#${wideArrow})"/>
        <g class="uio-remote" transform="translate(270 137)"><rect width="126" height="34" rx="5"/><text x="63" y="22" text-anchor="middle">fetch remote</text></g>
        <path class="uio-flow is-accent" d="M396 154H444" marker-end="url(#${wideArrow})"/>
        <g class="uio-mmap" transform="translate(462 137)"><rect width="118" height="34" rx="5"/><text x="59" y="22" text-anchor="middle">write mmap</text></g>
        <path class="uio-flow" d="M580 154H626" marker-end="url(#${wideArrow})"/>
        <text class="qi-label qi-label--strong" x="644" y="159">slice</text>

        <line class="uio-divider" x1="20" y1="196" x2="740" y2="196"/>
        <text class="uio-row-title is-covered" x="28" y="229">COVERED</text>
        <g class="uio-flight" transform="translate(112 203)"><rect width="166" height="42" rx="5"/><text x="83" y="18" text-anchor="middle"><tspan x="83">range covered by</tspan><tspan x="83" dy="14">in-flight fetch</tspan></text></g>
        <path class="uio-flow" d="M278 224H340" marker-end="url(#${wideArrow})"/>
        <text class="qi-label qi-label--strong" x="358" y="229">wait</text>
        <path class="uio-flow" d="M398 224H470" marker-end="url(#${wideArrow})"/>
        <g class="uio-mmap" transform="translate(488 207)"><rect width="112" height="34" rx="5"/><text x="56" y="22" text-anchor="middle">local mmap</text></g>
        <path class="uio-flow" d="M600 224H646" marker-end="url(#${wideArrow})"/>
        <text class="qi-label qi-label--strong" x="664" y="229">slice</text>
      </svg>

      <svg class="qi-svg uio-compact" viewBox="0 0 360 448" role="img" aria-label="DiskCache returns every read as a local mmap slice. Hits read it directly, misses fetch and populate it first, and covered reads wait for the existing fetch.">
        ${defs(compactArrow)}
        <text class="qi-title uio-heading" x="180" y="24" text-anchor="middle">Every path returns a local mmap slice</text>
        <text class="qi-label" x="180" y="45" text-anchor="middle">bitmap entries represent 16 KiB blocks</text>

        <text class="uio-row-title is-hit" x="18" y="82">HIT</text>
        <g class="uio-bits" transform="translate(86 64)"><rect x="0"/><rect x="24"/><rect x="48"/><text x="8" y="17">1</text><text x="32" y="17">1</text><text x="56" y="17">1</text></g>
        <path class="uio-flow" d="M166 78H202" marker-end="url(#${compactArrow})"/>
        <g class="uio-mmap" transform="translate(220 61)"><rect width="120" height="34" rx="5"/><text x="60" y="22" text-anchor="middle">mmap slice</text></g>
        <text class="qi-label" x="86" y="112">all blocks are local</text>

        <line class="uio-divider" x1="18" y1="132" x2="342" y2="132"/>
        <text class="uio-row-title is-miss" x="18" y="164">MISS</text>
        <g class="uio-bits" transform="translate(86 146)"><rect x="0"/><rect class="is-missing" x="24"/><rect class="is-missing" x="48"/><text x="8" y="17">1</text><text x="32" y="17">0</text><text x="56" y="17">0</text></g>
        <path class="uio-flow" d="M166 160H202" marker-end="url(#${compactArrow})"/>
        <g class="uio-remote" transform="translate(220 143)"><rect width="120" height="34" rx="5"/><text x="60" y="22" text-anchor="middle">fetch remote</text></g>
        <path class="uio-flow is-accent" d="M280 177V207" marker-end="url(#${compactArrow})"/>
        <g class="uio-mmap" transform="translate(220 218)"><rect width="120" height="34" rx="5"/><text x="60" y="22" text-anchor="middle">write mmap</text></g>
        <path class="uio-flow" d="M220 235H166" marker-end="url(#${compactArrow})"/>
        <text class="qi-label qi-label--strong" x="86" y="240">return slice</text>

        <line class="uio-divider" x1="18" y1="278" x2="342" y2="278"/>
        <text class="uio-row-title is-covered" x="18" y="312">COVERED</text>
        <g class="uio-flight" transform="translate(86 288)"><rect width="156" height="46" rx="5"/><text x="78" y="19" text-anchor="middle"><tspan x="78">range covered by</tspan><tspan x="78" dy="14">in-flight fetch</tspan></text></g>
        <path class="uio-flow" d="M242 311H278" marker-end="url(#${compactArrow})"/>
        <text class="qi-label qi-label--strong" x="296" y="316">wait</text>
        <path class="uio-flow" d="M296 328V358" marker-end="url(#${compactArrow})"/>
        <g class="uio-mmap" transform="translate(220 369)"><rect width="120" height="34" rx="5"/><text x="60" y="22" text-anchor="middle">mmap slice</text></g>
        <text class="qi-label" x="110" y="392">reuse fetch</text>
      </svg>
    </div>`;

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
