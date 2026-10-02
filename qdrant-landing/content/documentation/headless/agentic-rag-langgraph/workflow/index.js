/* Static, theme-aware figure on the existing island loader. No controls are
 * needed: the architecture and routing remain visible without interaction.
 * svg() is also the source for the self-contained SVG/PNG exports.
 */
let instance = 0;
export function svg(narrow = false, id = "agentic-rag") {
  return narrow ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 584" class="qi-svg qi-lg-workflow__narrow" role="img" aria-label="The user sends a query to the AI agent and receives its response. The agent selects RAG Tool 2 for Transformers documentation in Qdrant Collection 2, the Web Search Tool for the Brave Search API, or RAG Tool 1 for Hugging Face documentation in Qdrant Collection 1.">
<defs><marker id="${id}-arrow" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" class="qi-lg__head"/></marker></defs>
<rect x="1" y="1" width="338" height="582" rx="6" class="qi-frame"/>
<rect x="120" y="16" width="100" height="48" rx="6" class="qi-frame qi-lg__node"/>
<text x="170.0" y="44" class="qi-label qi-label--strong qi-lg__label" style="font-size:20px">User</text>
<rect x="70" y="128" width="200" height="76" rx="6" class="qi-frame qi-lg__node qi-lg__node--agent"/>
<text x="170.0" y="156" class="qi-label qi-label--strong qi-lg__label" style="font-size:20px">AI Agent</text>
<text x="170.0" y="180" class="qi-label qi-lg__sub" style="font-size:16px">gpt-4o + LangGraph</text>
<path d="M150 66 V126" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<path d="M190 126 V66" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<text x="132" y="101" class="qi-label qi-lg__edge-label" style="font-size:16px;text-anchor:end">query</text>
<text x="206" y="101" class="qi-label qi-lg__edge-label" style="font-size:16px;text-anchor:start">response</text>
<path d="M170 206 V224 H16 V526" class="qi-lg__edge"/>
<rect x="40" y="244" width="150" height="84" rx="6" class="qi-frame qi-lg__node qi-lg__node--rag"/>
<text x="115.0" y="272" class="qi-label qi-label--strong qi-lg__label" style="font-size:20px">RAG Tool 2</text>
<text x="115.0" y="296" class="qi-label qi-lg__sub" style="font-size:16px">Transformers</text>
<text x="115.0" y="320" class="qi-label qi-lg__sub" style="font-size:16px">docs</text>
<path d="M16 286 H38" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<rect x="224" y="244" width="104" height="84" rx="6" class="qi-frame qi-lg__node qi-lg__node--db"/>
<text x="276.0" y="272" class="qi-label qi-label--strong qi-lg__label" style="font-size:18px">Qdrant</text>
<text x="276.0" y="296" class="qi-label qi-lg__sub" style="font-size:16px">Collection</text>
<text x="276.0" y="320" class="qi-label qi-lg__sub" style="font-size:16px">2</text>
<path d="M192 286 H222" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<rect x="40" y="364" width="150" height="84" rx="6" class="qi-frame qi-lg__node qi-lg__node--web"/>
<path d="M48 370 H182" class="qi-lg__web-accent"/>
<text x="115.0" y="392" class="qi-label qi-label--strong qi-lg__label" style="font-size:20px">Web Search</text>
<text x="115.0" y="416" class="qi-label qi-lg__sub" style="font-size:16px">Brave Search</text>
<text x="115.0" y="440" class="qi-label qi-lg__sub" style="font-size:16px">API</text>
<path d="M16 406 H38" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<rect x="40" y="484" width="150" height="84" rx="6" class="qi-frame qi-lg__node qi-lg__node--rag"/>
<text x="115.0" y="512" class="qi-label qi-label--strong qi-lg__label" style="font-size:20px">RAG Tool 1</text>
<text x="115.0" y="536" class="qi-label qi-lg__sub" style="font-size:16px">Hugging Face</text>
<text x="115.0" y="560" class="qi-label qi-lg__sub" style="font-size:16px">docs</text>
<path d="M16 526 H38" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<rect x="224" y="484" width="104" height="84" rx="6" class="qi-frame qi-lg__node qi-lg__node--db"/>
<text x="276.0" y="512" class="qi-label qi-label--strong qi-lg__label" style="font-size:18px">Qdrant</text>
<text x="276.0" y="536" class="qi-label qi-lg__sub" style="font-size:16px">Collection</text>
<text x="276.0" y="560" class="qi-label qi-lg__sub" style="font-size:16px">1</text>
<path d="M192 526 H222" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
</svg>` : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 440" class="qi-svg qi-lg-workflow__wide" role="img" aria-label="The user sends a query to the AI agent and receives its response. The agent selects RAG Tool 2 for Transformers documentation in Qdrant Collection 2, the Web Search Tool for the Brave Search API, or RAG Tool 1 for Hugging Face documentation in Qdrant Collection 1.">
<defs><marker id="${id}-arrow" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" class="qi-lg__head"/></marker></defs>
<rect x="1" y="1" width="758" height="438" rx="6" class="qi-frame"/>
<circle cx="60" cy="240" r="30" class="qi-frame qi-lg__node"/><circle cx="60" cy="232" r="9" fill="none" class="qi-lg__icon" stroke-width="2"/><path d="M44 258 a16 14 0 0 1 32 0" fill="none" class="qi-lg__icon" stroke-width="2"/>
<text x="60" y="295" class="qi-label qi-label--strong qi-lg__label" >User</text>
<rect x="200" y="195" width="150" height="90" rx="6" class="qi-frame qi-lg__node qi-lg__node--agent"/>
<text x="275.0" y="223" class="qi-label qi-label--strong qi-lg__label" style="font-size:22px">AI Agent</text>
<text x="275.0" y="247" class="qi-label qi-lg__sub" style="font-size:20px">gpt-4o</text>
<text x="275.0" y="271" class="qi-label qi-lg__sub" style="font-size:20px">LangGraph</text>
<rect x="410" y="60" width="170" height="90" rx="6" class="qi-frame qi-lg__node qi-lg__node--rag"/>
<text x="495.0" y="88" class="qi-label qi-label--strong qi-lg__label" style="font-size:22px">RAG Tool 2</text>
<text x="495.0" y="112" class="qi-label qi-lg__sub" style="font-size:20px">Transformers</text>
<text x="495.0" y="136" class="qi-label qi-lg__sub" style="font-size:20px">docs</text>
<rect x="410" y="195" width="170" height="90" rx="6" class="qi-frame qi-lg__node qi-lg__node--web"/>
<path d="M418 201 H572" class="qi-lg__web-accent"/>
<text x="495.0" y="223" class="qi-label qi-label--strong qi-lg__label" style="font-size:22px">Web Search</text>
<text x="495.0" y="247" class="qi-label qi-lg__sub" style="font-size:20px">Brave Search</text>
<text x="495.0" y="271" class="qi-label qi-lg__sub" style="font-size:20px">API</text>
<rect x="410" y="330" width="170" height="90" rx="6" class="qi-frame qi-lg__node qi-lg__node--rag"/>
<text x="495.0" y="358" class="qi-label qi-label--strong qi-lg__label" style="font-size:22px">RAG Tool 1</text>
<text x="495.0" y="382" class="qi-label qi-lg__sub" style="font-size:20px">Hugging Face</text>
<text x="495.0" y="406" class="qi-label qi-lg__sub" style="font-size:20px">docs</text>
<rect x="620" y="60" width="130" height="90" rx="6" class="qi-frame qi-lg__node qi-lg__node--db"/>
<text x="685.0" y="88" class="qi-label qi-label--strong qi-lg__label" style="font-size:22px">Qdrant</text>
<text x="685.0" y="112" class="qi-label qi-lg__sub" style="font-size:20px">Collection</text>
<text x="685.0" y="136" class="qi-label qi-lg__sub" style="font-size:20px">2</text>
<rect x="620" y="330" width="130" height="90" rx="6" class="qi-frame qi-lg__node qi-lg__node--db"/>
<text x="685.0" y="358" class="qi-label qi-label--strong qi-lg__label" style="font-size:22px">Qdrant</text>
<text x="685.0" y="382" class="qi-label qi-lg__sub" style="font-size:20px">Collection</text>
<text x="685.0" y="406" class="qi-label qi-lg__sub" style="font-size:20px">1</text>
<path d="M92 240 H198" class="qi-lg__edge" marker-end="url(#${id}-arrow)" marker-start="url(#${id}-arrow)"/>
<text x="145" y="221" class="qi-label qi-lg__edge-label" >query</text>
<text x="145" y="268" class="qi-label qi-lg__edge-label" >response</text>
<path d="M352 240 C376 240 384 105 408 105" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<path d="M352 240 H408" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<path d="M352 240 C376 240 384 375 408 375" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<path d="M582 105 H618" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
<path d="M582 375 H618" class="qi-lg__edge" marker-end="url(#${id}-arrow)"/>
</svg>`;
}
export function mount(node) {
  node.classList.add('qi-lg-workflow');
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
    const id = `qi-lg-workflow-${++instance}`;
    node.innerHTML = svg(false, `${id}-wide`) + svg(true, `${id}-narrow`);
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
