let instanceId = 0;

export function mount(node) {
  node.classList.add('uio-bridge');
  const id = ++instanceId;
  const wideArrow = `uio-bridge-arrow-wide-${id}`;
  const compactArrow = `uio-bridge-arrow-compact-${id}`;
  const defs = (arrowId) => `<defs><marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="uio-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>`;

  node.innerHTML = `
    <div class="qi-fig">
      <svg class="qi-svg uio-wide" viewBox="0 0 760 258" role="img" aria-label="The synchronous caller schedules reads A, B, and C without waiting. Tokio workers finish them out of order: B, then C, then A. Each reply's slot maps it back to the original request.">
        ${defs(wideArrow)}
        <text class="qi-title" x="20" y="35">synchronous pipeline</text>
        <text class="qi-label" x="20" y="88">schedule immediately</text>
        <text class="qi-label" x="440" y="30">wait() receives finish order</text>

        <g class="uio-request is-a"><circle cx="180" cy="54" r="12"/><text x="180" y="59" text-anchor="middle">A</text></g>
        <g class="uio-request is-b"><circle cx="245" cy="54" r="12"/><text x="245" y="59" text-anchor="middle">B</text></g>
        <g class="uio-request is-c"><circle cx="310" cy="54" r="12"/><text x="310" y="59" text-anchor="middle">C</text></g>

        <path class="uio-flow is-a" d="M180 68V104" marker-end="url(#${wideArrow})"/>
        <path class="uio-flow is-b" d="M245 68V146" marker-end="url(#${wideArrow})"/>
        <path class="uio-flow is-c" d="M310 68V188" marker-end="url(#${wideArrow})"/>

        <text class="qi-title" x="20" y="132">Tokio workers</text>
        <rect class="uio-worker is-a" x="180" y="105" width="470" height="28" rx="5"/>
        <text class="uio-worker-label" x="192" y="124">read A · slot 0</text>
        <rect class="uio-worker is-b" x="245" y="147" width="200" height="28" rx="5"/>
        <text class="uio-worker-label" x="257" y="166">read B · slot 1</text>
        <rect class="uio-worker is-c" x="310" y="189" width="235" height="28" rx="5"/>
        <text class="uio-worker-label" x="322" y="208">read C · slot 2</text>

        <path class="uio-return is-b" d="M445 147V70" marker-end="url(#${wideArrow})"/>
        <path class="uio-return is-c" d="M545 189V70" marker-end="url(#${wideArrow})"/>
        <path class="uio-return is-a" d="M650 105V70" marker-end="url(#${wideArrow})"/>
        <g class="uio-result is-b"><circle cx="445" cy="54" r="12"/><text x="445" y="59" text-anchor="middle">B</text></g>
        <g class="uio-result is-c"><circle cx="545" cy="54" r="12"/><text x="545" y="59" text-anchor="middle">C</text></g>
        <g class="uio-result is-a"><circle cx="650" cy="54" r="12"/><text x="650" y="59" text-anchor="middle">A</text></g>
        <text class="qi-label qi-label--strong" x="548" y="244" text-anchor="middle">finish order: B → C → A</text>
      </svg>

      <svg class="qi-svg uio-compact" viewBox="0 0 360 470" role="img" aria-label="The synchronous caller schedules A, B, and C. Tokio workers finish B, C, and A in that order, and each slot maps the reply back to its request.">
        ${defs(compactArrow)}
        <text class="qi-title" x="72" y="28" text-anchor="middle">sync caller</text>
        <text class="qi-title" x="245" y="28" text-anchor="middle">Tokio workers</text>
        <path class="uio-lane" d="M44 86V374M44 86H60M44 142H60M44 198H60M44 240H60M44 302H60M44 374H60"/>

        <g class="uio-request is-a"><circle cx="72" cy="86" r="12"/><text x="72" y="91" text-anchor="middle">A</text></g>
        <g class="uio-request is-b"><circle cx="72" cy="142" r="12"/><text x="72" y="147" text-anchor="middle">B</text></g>
        <g class="uio-request is-c"><circle cx="72" cy="198" r="12"/><text x="72" y="203" text-anchor="middle">C</text></g>
        <text class="qi-label" x="18" y="62">schedule</text>

        <path class="uio-flow is-a" d="M86 86H142" marker-end="url(#${compactArrow})"/>
        <path class="uio-flow is-b" d="M86 142H174" marker-end="url(#${compactArrow})"/>
        <path class="uio-flow is-c" d="M86 198H206" marker-end="url(#${compactArrow})"/>
        <rect class="uio-worker is-a" x="146" y="74" width="28" height="300" rx="5"/>
        <rect class="uio-worker is-b" x="178" y="130" width="28" height="110" rx="5"/>
        <rect class="uio-worker is-c" x="210" y="186" width="28" height="116" rx="5"/>
        <text class="uio-worker-label" x="160" y="98" text-anchor="middle">A</text>
        <text class="uio-worker-label" x="192" y="154" text-anchor="middle">B</text>
        <text class="uio-worker-label" x="224" y="210" text-anchor="middle">C</text>

        <path class="uio-return is-b" d="M178 240H88" marker-end="url(#${compactArrow})"/>
        <path class="uio-return is-c" d="M210 302H88" marker-end="url(#${compactArrow})"/>
        <path class="uio-return is-a" d="M146 374H88" marker-end="url(#${compactArrow})"/>
        <g class="uio-result is-b"><circle cx="72" cy="240" r="12"/><text x="72" y="245" text-anchor="middle">B</text></g>
        <g class="uio-result is-c"><circle cx="72" cy="302" r="12"/><text x="72" y="307" text-anchor="middle">C</text></g>
        <g class="uio-result is-a"><circle cx="72" cy="374" r="12"/><text x="72" y="379" text-anchor="middle">A</text></g>
        <text class="qi-label qi-label--strong" x="180" y="444" text-anchor="middle">finish order: B → C → A</text>
      </svg>
    </div>`;

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
