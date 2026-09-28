/*
 * edge-on-device island — replacement for qdrant-edge.png.
 *
 * A static diagram, drawn as inline SVG rather than a raster image so it
 * follows the host theme and stays sharp at any width. There is no state and
 * no event handling here: mount() builds the picture once and reports ready.
 *
 * It draws one boundary and puts everything that matters inside it. The device
 * holds the application process, the application process holds the Edge Shard,
 * and both ingest and query run down lanes that never cross the boundary. A
 * Qdrant server sits outside it, dimmed, because Edge does not need one, with
 * a dashed connector for the sync that remains available.
 *
 * Colors come from the shared island design system (islands.scss): chrome
 * switches with the host theme, the two operation hues stay constant.
 */

// Geometry (SVG user units).
const VB_W = 720;
const VB_H = 340;

// On-device column.
const DEV_MID = 242;
const CODE_B = 152; // bottom of the "Application logic" box
const SHARD_T = 212; // top of the Edge Shard box
const ING_X = 170;
const QRY_X = 314;
const LANE_MID = (CODE_B + SHARD_T) / 2 + 4;

// Off-device column.
const DIV_X = 500; // the network boundary
const OFF_MID = 625;
const LINK_Y = 198;

// An arrowhead sitting on (x, y), pointing up or down.
const head = (x, y, up) =>
  up ? `M ${x} ${y} l -5 9 l 10 0 Z` : `M ${x} ${y} l -5 -9 l 10 0 Z`;

export function mount(node) {
  node.classList.add('qi-eod');

  node.innerHTML = [
    `<svg class="qi-svg qi-eod__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`,
    '     aria-label="A device frame holds the application process, which holds the Edge Shard. Ingest and query run between the application logic and the shard, inside that frame, and never cross the network boundary. A Qdrant server sits outside the boundary, dimmed, labelled not required, joined by a dashed optional sync connector.">',

    // ---- column headings ----
    `  <text class="qi-title" x="${DEV_MID}" y="20" text-anchor="middle">On the device</text>`,
    `  <text class="qi-title qi-eod__off-title" x="${OFF_MID}" y="20" text-anchor="middle">Off the device</text>`,

    // ---- the boundary nothing local crosses ----
    `  <line class="qi-eod__divider" x1="${DIV_X}" y1="34" x2="${DIV_X}" y2="326"/>`,

    // ---- device > application process > shard ----
    '  <rect class="qi-eod__shell" x="6" y="34" width="472" height="292" rx="10"/>',
    '  <text class="qi-label" x="22" y="54">Device</text>',
    '  <rect class="qi-eod__box" x="30" y="64" width="424" height="250" rx="8"/>',
    `  <text class="qi-label" x="${DEV_MID}" y="86" text-anchor="middle">Your application, one process</text>`,

    '  <rect class="qi-eod__box" x="70" y="100" width="344" height="52" rx="6"/>',
    `  <text class="qi-label qi-label--strong" x="${DEV_MID}" y="132" text-anchor="middle">Application logic</text>`,

    '  <rect class="qi-eod__box qi-eod__box--store" x="70" y="212" width="344" height="86" rx="6"/>',
    `  <text class="qi-label qi-label--strong" x="${DEV_MID}" y="246" text-anchor="middle">Edge Shard</text>`,
    `  <text class="qi-label" x="${DEV_MID}" y="266" text-anchor="middle">vectors, payload, index</text>`,

    // ---- the two local lanes ----
    '  <g class="qi-eod__lane qi-eod__lane--ingest">',
    `    <line class="qi-eod__wire" x1="${ING_X}" y1="${CODE_B}" x2="${ING_X}" y2="${SHARD_T}"/>`,
    `    <path class="qi-eod__head" d="${head(ING_X, SHARD_T, false)}"/>`,
    `    <text class="qi-label qi-eod__lane-label" x="${ING_X - 12}" y="${LANE_MID}" text-anchor="end">ingest</text>`,
    '  </g>',
    '  <g class="qi-eod__lane qi-eod__lane--query">',
    `    <line class="qi-eod__wire" x1="${QRY_X}" y1="${CODE_B}" x2="${QRY_X}" y2="${SHARD_T}"/>`,
    `    <path class="qi-eod__head" d="${head(QRY_X, SHARD_T, false)}"/>`,
    `    <path class="qi-eod__head" d="${head(QRY_X, CODE_B, true)}"/>`,
    `    <text class="qi-label qi-eod__lane-label" x="${QRY_X + 12}" y="${LANE_MID}" text-anchor="start">query</text>`,
    '  </g>',

    // ---- the server Edge does not need ----
    '  <g class="qi-eod__off">',
    `    <text class="qi-label" x="${OFF_MID}" y="140" text-anchor="middle">optional sync</text>`,
    '    <rect class="qi-eod__shell" x="540" y="150" width="170" height="96" rx="10"/>',
    `    <text class="qi-label qi-label--strong" x="${OFF_MID}" y="192" text-anchor="middle">Qdrant Server</text>`,
    `    <text class="qi-label" x="${OFF_MID}" y="212" text-anchor="middle">not required</text>`,
    `    <line class="qi-eod__link" x1="478" y1="${LINK_Y}" x2="540" y2="${LINK_Y}"/>`,
    '  </g>',

    '</svg>',
  ].join('');

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
