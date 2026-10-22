let instanceId = 0;

export function mount(node) {
  node.classList.add('uio-architecture');
  const id = ++instanceId;
  const wideArrow = `uio-architecture-arrow-wide-${id}`;
  const compactArrow = `uio-architecture-arrow-compact-${id}`;
  const defs = (arrowId) => `<defs><marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="uio-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>`;

  node.innerHTML = `
    <div class="qi-fig">
      <svg class="qi-svg uio-wide" viewBox="0 0 760 286" role="img" aria-label="The same consumer code uses one ReadPipeline. mmap returns a direct slice with one read in flight. io_uring uses submission and completion rings with 16 reads in flight. Network I/O uses Tokio tasks with up to 256 reads in flight.">
        ${defs(wideArrow)}
        <text class="qi-title uio-heading" x="380" y="24" text-anchor="middle">Consumer code stays the same</text>
        <text class="qi-label" x="380" y="46" text-anchor="middle">vectors · HNSW links · payload indexes</text>
        <path class="uio-flow" d="M380 56V72" marker-end="url(#${wideArrow})"/>
        <rect class="qi-frame uio-pipeline" x="145" y="76" width="470" height="54" rx="6"/>
        <text class="qi-title" x="380" y="99" text-anchor="middle">ReadPipeline</text>
        <text class="qi-label" x="380" y="119" text-anchor="middle">schedule() · wait()</text>
        <path class="uio-flow" d="M380 130V151"/>
        <path class="uio-flow" d="M380 151H118V169" marker-end="url(#${wideArrow})"/>
        <path class="uio-flow" d="M380 151V169" marker-end="url(#${wideArrow})"/>
        <path class="uio-flow" d="M380 151H642V169" marker-end="url(#${wideArrow})"/>

        <g transform="translate(20 0)">
          <text class="qi-title" x="98" y="194" text-anchor="middle">mmap</text>
          <text class="qi-label" x="98" y="216" text-anchor="middle">direct mapped slice</text>
          <rect class="uio-slot is-mmap" x="90" y="230" width="16" height="16" rx="3"/>
          <text class="qi-label qi-label--strong" x="98" y="272" text-anchor="middle">1 in flight</text>
        </g>

        <line class="uio-divider" x1="254" y1="181" x2="254" y2="276"/>
        <g>
          <text class="qi-title" x="380" y="194" text-anchor="middle">io_uring</text>
          <text class="qi-label" x="380" y="216" text-anchor="middle">kernel ring buffers</text>
          <g class="uio-ring" transform="translate(350 239)"><circle r="17"/><circle class="uio-ring-hole" r="9"/><text x="0" y="4" text-anchor="middle">SQ</text></g>
          <g class="uio-ring" transform="translate(410 239)"><circle r="17"/><circle class="uio-ring-hole" r="9"/><text x="0" y="4" text-anchor="middle">CQ</text></g>
          <text class="qi-label qi-label--strong" x="380" y="272" text-anchor="middle">16 in flight</text>
        </g>

        <line class="uio-divider" x1="506" y1="181" x2="506" y2="276"/>
        <g transform="translate(524 0)">
          <text class="qi-title" x="118" y="194" text-anchor="middle">Network I/O</text>
          <text class="qi-label" x="118" y="216" text-anchor="middle">Tokio task pool</text>
          <g class="uio-task-grid">
            <circle cx="78" cy="232" r="5"/><circle cx="94" cy="232" r="5"/><circle cx="110" cy="232" r="5"/><circle cx="126" cy="232" r="5"/><circle cx="142" cy="232" r="5"/><circle cx="158" cy="232" r="5"/>
            <circle cx="78" cy="248" r="5"/><circle cx="94" cy="248" r="5"/><circle cx="110" cy="248" r="5"/><circle cx="126" cy="248" r="5"/><circle cx="142" cy="248" r="5"/><circle cx="158" cy="248" r="5"/>
          </g>
          <text class="qi-label qi-label--strong" x="118" y="272" text-anchor="middle">up to 256 in flight</text>
        </g>
      </svg>

      <svg class="qi-svg uio-compact" viewBox="0 0 360 472" role="img" aria-label="The same consumer code uses one ReadPipeline and three backend-specific execution models: direct mmap slices, io_uring rings, or Tokio network tasks.">
        ${defs(compactArrow)}
        <text class="qi-title uio-heading" x="180" y="24" text-anchor="middle">Consumer code stays the same</text>
        <text class="qi-label" x="180" y="45" text-anchor="middle">vectors · HNSW · payload indexes</text>
        <path class="uio-flow" d="M180 54V70" marker-end="url(#${compactArrow})"/>
        <rect class="qi-frame uio-pipeline" x="35" y="74" width="290" height="54" rx="6"/>
        <text class="qi-title" x="180" y="97" text-anchor="middle">ReadPipeline</text>
        <text class="qi-label" x="180" y="117" text-anchor="middle">schedule() · wait()</text>
        <path class="uio-flow" d="M180 128V150H28V425"/>

        <g transform="translate(48 156)">
          <path class="uio-flow" d="M-20 42H0" marker-end="url(#${compactArrow})"/>
          <text class="qi-title" x="0" y="16">mmap</text>
          <text class="qi-label" x="0" y="38">direct mapped slice</text>
          <rect class="uio-slot is-mmap" x="238" y="13" width="16" height="16" rx="3"/>
          <text class="qi-label qi-label--strong" x="254" y="52" text-anchor="end">1 in flight</text>
        </g>
        <line class="uio-divider" x1="48" y1="228" x2="332" y2="228"/>

        <g transform="translate(48 246)">
          <path class="uio-flow" d="M-20 42H0" marker-end="url(#${compactArrow})"/>
          <text class="qi-title" x="0" y="16">io_uring</text>
          <text class="qi-label" x="0" y="38">kernel ring buffers</text>
          <g class="uio-ring" transform="translate(212 25)"><circle r="15"/><circle class="uio-ring-hole" r="8"/><text x="0" y="4" text-anchor="middle">SQ</text></g>
          <g class="uio-ring" transform="translate(258 25)"><circle r="15"/><circle class="uio-ring-hole" r="8"/><text x="0" y="4" text-anchor="middle">CQ</text></g>
          <text class="qi-label qi-label--strong" x="284" y="58" text-anchor="end">16 in flight</text>
        </g>
        <line class="uio-divider" x1="48" y1="324" x2="332" y2="324"/>

        <g transform="translate(48 342)">
          <path class="uio-flow" d="M-20 42H0" marker-end="url(#${compactArrow})"/>
          <text class="qi-title" x="0" y="16">Network I/O</text>
          <text class="qi-label" x="0" y="38">Tokio task pool</text>
          <g class="uio-task-grid">
            <circle cx="204" cy="17" r="5"/><circle cx="220" cy="17" r="5"/><circle cx="236" cy="17" r="5"/><circle cx="252" cy="17" r="5"/><circle cx="268" cy="17" r="5"/>
            <circle cx="204" cy="33" r="5"/><circle cx="220" cy="33" r="5"/><circle cx="236" cy="33" r="5"/><circle cx="252" cy="33" r="5"/><circle cx="268" cy="33" r="5"/>
          </g>
          <text class="qi-label qi-label--strong" x="284" y="62" text-anchor="end">up to 256 in flight</text>
        </g>
      </svg>
    </div>`;

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
