/* Static, theme-aware figure on the existing island loader. No controls are
 * needed: the architecture and routing remain visible without interaction.
 * svg() is also the source for the self-contained SVG/PNG exports.
 */
let instance = 0;
export function svg(id = "langgraph") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 420" class="qi-svg qi-lg-graph__svg" role="img" aria-label="START leads to the agent node. From the agent, a conditional edge goes to the tools node when the last message has tool calls, otherwise to END. The tools node always returns to the agent.">
  <defs>
    <marker id="${id}-ah" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="qi-lg__head"/></marker>
    <marker id="${id}-ahs" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="qi-lg__head qi-lg__head--strong"/></marker>
  </defs>
<rect x="0.5" y="0.5" width="339" height="419" rx="6" class="qi-frame"/>
<rect x="110" y="60" width="120" height="44" rx="22" class="qi-frame qi-lg__node"/><text x="170" y="88" class="qi-label qi-label--strong qi-lg__label">START</text>
<rect x="100" y="160" width="140" height="56" rx="6" class="qi-frame qi-lg__node qi-lg__node--agent"/><text x="170.0" y="194.0" class="qi-label qi-label--strong qi-lg__label">agent</text>
<rect x="60" y="300" width="120" height="56" rx="6" class="qi-frame qi-lg__node qi-lg__node--rag"/><text x="120.0" y="334.0" class="qi-label qi-label--strong qi-lg__label">tools</text>
<rect x="200" y="306" width="100" height="44" rx="22" class="qi-frame qi-lg__node qi-lg__node--end"/><text x="250" y="334" class="qi-label qi-label--strong qi-lg__label">END</text>
<line x1="170" y1="106" x2="170" y2="157" class="qi-lg__edge qi-lg__edge--strong" marker-end="url(#${id}-ahs)"/>
<path d="M130,218 C 130,255 110,255 110,297" class="qi-lg__edge qi-lg__edge--dashed" marker-end="url(#${id}-ah)"/>
<text x="12" y="262" class="qi-label qi-lg__edge-label" style="text-anchor:start">tool_calls</text>
<path d="M160,298 C 160,255 190,255 190,219" class="qi-lg__edge qi-lg__edge--strong" marker-end="url(#${id}-ahs)"/>
<path d="M225,218 C 225,255 250,255 250,303" class="qi-lg__edge qi-lg__edge--dashed" marker-end="url(#${id}-ah)"/>
<text x="258" y="262" class="qi-label qi-lg__edge-label" style="text-anchor:start">no tools</text>
<line x1="20" y1="392" x2="56" y2="392" class="qi-lg__edge qi-lg__edge--dashed"/><text x="64" y="397" class="qi-label qi-lg__sub" style="text-anchor:start">conditional edge (route)</text>
</svg>`;
}
export function mount(node) {
  node.classList.add('qi-lg-graph');
  const wrapper = node.closest('.island');
  // The shared loader injects CSS without waiting for it. Do not expose an
  // unstyled drawing or signal ready until this figure's stylesheet is usable.
  const stylesheet = document.querySelector(`link[href="${wrapper.dataset.islandCss}"]`);
  const render = () => {
    if (wrapper.classList.contains('is-failed')) return;
    if (getComputedStyle(node).getPropertyValue('--qi-lg-ready').trim() !== '1') {
      fail();
      return;
    }
    node.innerHTML = svg(`qi-lg-graph-${++instance}`);
    node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
  };
  const fail = () => node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
  if (!stylesheet) fail();
  else if (stylesheet.sheet) render();
  else {
    stylesheet.addEventListener('load', render, { once: true });
    stylesheet.addEventListener('error', fail, { once: true });
  }
}
