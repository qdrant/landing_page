// Static overview of the same illustrative points as production/tenant-isolation.
// Regenerate the standalone fallback with: uv run generate-fallback.py
const POINTS = [
  { id: 1, tenant: 1, vector: "[0.9, 0.1, 0.1]" },
  { id: 2, tenant: 1, vector: "[0.1, 0.9, 0.1]" },
  { id: 3, tenant: 2, vector: "[0.1, 0.1, 0.9]" },
];
let instance = 0;
const TENANT_COLORS = ["#6047ff", "#388e3c"];
const FOREGROUND = "var(--qi-fg, #303547)";
const MUTED = "var(--qi-muted, #656b7f)";
const SURFACE = "var(--qi-surface, #f0f3fa)";

function point(point, x, y, width, height) {
  return `<g data-tenant="${point.tenant}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${SURFACE}" stroke="${TENANT_COLORS[point.tenant - 1]}" stroke-width="1.5"/>
    <text x="${x + 16}" y="${y + 25}" font-size="13" font-weight="600">id=${point.id}</text>
    <text x="${x + 16}" y="${y + 49}" font-size="12" fill="${MUTED}">payload</text>
    <text x="${x + 16}" y="${y + 70}">group_id: "tenant_${point.tenant}"</text>
    <text x="${x + 16}" y="${y + 96}" font-size="12" fill="${MUTED}">vector</text>
    <text x="${x + 16}" y="${y + 117}">${point.vector}</text>
  </g>`;
}

export function renderSvg(compact, prefix) {
  const width = compact ? 360 : 720;
  const height = compact ? 568 : 278;
  const paths = compact
    ? [["M20 76 V296 H34", "M20 148 H34"], ["M20 410 V482 H34"]]
    : [["M243.5 76 V94 H127 V108", "M243.5 94 H360 V108"], ["M593 76 V108"]];
  const tenants = compact
    ? [
        [42, 64],
        [42, 398],
      ]
    : [
        [205, 64],
        [555, 64],
      ];
  const positions = compact
    ? [
        [40, 82, 304, 132],
        [40, 230, 304, 132],
        [40, 416, 304, 132],
      ]
    : [
        [20, 114, 214, 144],
        [253, 114, 214, 144],
        [486, 114, 214, 144],
      ];

  return `<svg xmlns="http://www.w3.org/2000/svg" class="qi-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display:block;width:100%;height:auto" font-family="var(--qi-mono, 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)" font-size="14" fill="${FOREGROUND}" role="img" aria-labelledby="${prefix}-title ${prefix}-description">
    <title id="${prefix}-title">Two tenants share one collection</title>
    <desc id="${prefix}-description">The tenant_data collection contains three points. Tenant 1 owns points 1 and 2; Tenant 2 owns point 3. The group_id payload field identifies the tenant. Each point has its own vector. Arrows connect tenants to their points, rather than showing shard boundaries.</desc>
    <defs>
      ${TENANT_COLORS.map((color, i) => `<marker id="${prefix}-arrow-${i + 1}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path fill="${color}" d="M0 0 L8 4 L0 8 Z"/></marker>`).join("")}
    </defs>
    <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="6" fill="${SURFACE}" stroke="var(--qi-border, #d3d9eb)"/>
    <text x="20" y="29" fill="${MUTED}">collection_name="tenant_data"</text>
    ${tenants.map(([x, y], i) => `<g><circle fill="${TENANT_COLORS[i]}" cx="${x - 13}" cy="${y - 5}" r="4"/><text x="${x}" y="${y}" font-size="13" font-weight="600">Tenant ${i + 1}</text></g>`).join("")}
    ${paths.flatMap((connections, i) => connections.map((path) => `<path fill="none" stroke="${TENANT_COLORS[i]}" stroke-width="1.5" d="${path}" marker-end="url(#${prefix}-arrow-${i + 1})"/>`)).join("")}
    ${POINTS.map((entry, i) => point(entry, ...positions[i])).join("")}
  </svg>`;
}

export function mount(node) {
  const prefix = `shared-collection-${++instance}`;
  let compact;
  function layout(width) {
    const next = width > 0 && width < 600;
    if (next === compact) return;
    compact = next;
    node.innerHTML = renderSvg(compact, prefix);
    node.dataset.layout = compact ? "compact" : "wide";
  }
  layout(node.clientWidth);
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(([entry]) => {
      if (!node.isConnected) {
        observer.disconnect();
        return;
      }
      layout(entry.contentRect.width);
    });
    observer.observe(node);
  }
  node.dispatchEvent(new CustomEvent("island:ready", { bubbles: true }));
}
