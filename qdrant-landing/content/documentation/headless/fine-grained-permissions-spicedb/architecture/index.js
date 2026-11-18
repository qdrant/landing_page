/* Application data flow. Service names identify the dependency of each step;
 * the application makes the calls and removes denied documents. The exported
 * narrow SVG is also the source of the static image fallback.
 */
let instance = 0;

const ROOT = 'qi-sp-arch';
const LABEL = 'The user sends a question to the application. The application embeds the question and retrieves candidate documents from Qdrant. It checks their document IDs with SpiceDB and removes denied documents. The LLM receives only authorized context. The application returns the answer to the user.';
const STEPS = [
  ['Embed query', 'Embedding model'],
  ['Retrieve', 'Qdrant'],
  ['Check access', 'SpiceDB'],
  ['Generate answer', 'LLM'],
];

function text(x, y, value, cls = '', anchor = 'middle') {
  return `<text x="${x}" y="${y}" class="qi-label ${cls}" text-anchor="${anchor}">${value}</text>`;
}

function box(x, y, w, h, cls = '') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="qi-frame ${cls}"/>`;
}

function edge(id, path, authorized = false) {
  return `<path d="${path}" class="qi-sp-arch__edge${authorized ? ' qi-sp-arch__edge--authorized' : ''}" marker-end="url(#${id}${authorized ? '-authorized' : ''})"/>`;
}

function stage(x, y, w, h, step) {
  const [title, service] = STEPS[step];
  return box(x, y, w, h, `qi-sp-arch__node${step === 2 ? ' qi-sp-arch__node--authorization' : ''}`) +
    text(x + w / 2, y + 28, title, 'qi-label--strong qi-sp-arch__title') +
    text(x + w / 2, y + 50, service, 'qi-sp-arch__service');
}

export function svg(narrow = false, id = ROOT) {
  const w = narrow ? 340 : 760;
  const h = narrow ? 596 : 294;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" class="qi-svg qi-sp-arch__${narrow ? 'narrow' : 'wide'}" role="img" aria-label="${LABEL}">`;
  out += '<defs>' + ['', '-authorized'].map(suffix =>
    `<marker id="${id}${suffix}" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L8 4 L0 8 Z" class="qi-sp-arch__head${suffix ? ' qi-sp-arch__head--authorized' : ''}"/></marker>`
  ).join('') + '</defs>';

  if (narrow) {
    out += box(16, 80, 308, 426) +
      text(32, 102, 'Application', 'qi-sp-arch__boundary-label', 'start') +
      box(70, 12, 200, 40, 'qi-sp-arch__node') +
      text(170, 37, 'User question', 'qi-label--strong qi-sp-arch__endpoint') +
      edge(id, 'M170 54 V114');
    STEPS.forEach((_, i) => {
      const y = 116 + i * 104;
      out += stage(44, y, 252, 64, i);
      if (i < STEPS.length - 1) out += edge(id, `M170 ${y + 66} V${y + 102}`, i === 2);
    });
    out += text(184, 413, 'Allowed only', 'qi-label--strong qi-sp-arch__service', 'start') +
      edge(id, 'M170 494 V538') +
      box(70, 540, 200, 40, 'qi-sp-arch__node') +
      text(170, 565, 'Answer to user', 'qi-label--strong qi-sp-arch__endpoint');
  } else {
    out += box(16, 90, 728, 188) +
      text(380, 116, 'Application workflow', 'qi-sp-arch__boundary-label') +
      box(32, 16, 156, 44, 'qi-sp-arch__node') +
      text(110, 43, 'User question', 'qi-label--strong qi-sp-arch__endpoint') +
      edge(id, 'M110 62 V142') +
      box(572, 16, 156, 44, 'qi-sp-arch__node') +
      text(650, 43, 'Answer to user', 'qi-label--strong qi-sp-arch__endpoint') +
      edge(id, 'M650 142 V62');
    STEPS.forEach((_, i) => {
      const x = 32 + i * 180;
      out += stage(x, 144, 156, 72, i);
      if (i < STEPS.length - 1) out += edge(id, `M${x + 158} 180 H${x + 178}`, i === 2);
    });
    out += text(32, 258, 'The application calls each service.', 'qi-sp-arch__service', 'start') +
      text(560, 246, 'Authorized context only', 'qi-label--strong qi-sp-arch__service');
  }
  return out + '</svg>';
}

export function mount(node) {
  node.classList.add(ROOT);
  const wrapper = node.closest('.island');
  const stylesheet = document.querySelector(`link[href="${wrapper.dataset.islandCss}"]`);
  const fail = () => node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
  const render = () => {
    if (wrapper.classList.contains('is-failed')) return;
    if (getComputedStyle(node).getPropertyValue('--qi-sp-ready').trim() !== '1') {
      fail();
      return;
    }
    const id = `${ROOT}-${++instance}`;
    node.innerHTML = svg(false, `${id}-wide`) + svg(true, `${id}-narrow`);
    node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
  };
  if (!stylesheet) fail();
  else if (stylesheet.sheet) render();
  else {
    stylesheet.addEventListener('load', render, { once: true });
    stylesheet.addEventListener('error', fail, { once: true });
  }
}
