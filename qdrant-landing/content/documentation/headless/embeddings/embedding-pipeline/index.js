// All vector values and point positions in this conceptual pipeline are illustrative.
const INPUTS = [
  { id: 'image', label: 'Image', name: 'Images', values: '0.6, 0.3, 0.1, ...', glyph: '<rect x="3" y="4" width="22" height="20" rx="2"/><circle cx="10" cy="10" r="2"/><path d="m4 21 6-6 4 4 4-7 6 9"/>' },
  { id: 'document', label: 'Document', name: 'Documents', values: '0.8, 0.5, 0.3, ...', glyph: '<path d="M6 3h11l5 5v17H6zM17 3v6h5M10 13h8M10 17h8M10 21h6"/>' },
  { id: 'audio', label: 'Audio', name: 'Audio', values: '0.4, 0.2, 0.9, ...', glyph: '<path d="M4 12v5M9 7v15M14 3v23M19 8v13M24 11v7"/>' },
];

export function mount(node) {
  node.classList.add('qi-ep');
  node.innerHTML = `<div class="qi-fig">
    <div class="qi-controls"><div class="qi-group" role="group" aria-label="Input type">
      ${INPUTS.map(input => `<button type="button" class="qi-chip" data-input="${input.id}" aria-pressed="false">${input.label}</button>`).join('')}
    </div></div>
    <div class="qi-ep__diagram">
      <svg class="qi-svg qi-ep__wires" aria-hidden="true">${INPUTS.map(() => '<g><path/><path/><path/></g>').join('')}</svg>
      <div class="qi-ep__inputs">${INPUTS.map(input => `<div class="qi-ep__input" data-kind="${input.id}"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">${input.glyph}</svg><span>${input.name}</span></div>`).join('')}</div>
      <div class="qi-ep__model">Embedding Model</div>
      <div class="qi-ep__vectors">${INPUTS.map(input => `<div class="qi-ep__vector" data-kind="${input.id}"><span class="qi-label">[${input.values}]</span><span>illustrative</span></div>`).join('')}</div>
      <div class="qi-ep__space"><p>Vector space</p><svg class="qi-svg" viewBox="0 0 200 200" role="img" aria-label="Illustrative shared vector space; document points highlighted."><rect class="qi-frame" x="2" y="2" width="196" height="196" rx="6"/><path class="qi-ep__axes" d="M20 18V180H182"/>${INPUTS.map(input => `<g data-kind="${input.id}"></g>`).join('')}</svg></div>
    </div>
    <p class="qi-status visually-hidden" role="status" aria-live="polite" aria-atomic="true"></p>
  </div>`;
  const diagram = node.querySelector('.qi-ep__diagram');
  const wireSvg = node.querySelector('.qi-ep__wires');
  const wires = [...wireSvg.children];
  const inputs = [...node.querySelectorAll('.qi-ep__input')];
  const vectors = [...node.querySelectorAll('.qi-ep__vector')];
  const model = node.querySelector('.qi-ep__model');
  const space = node.querySelector('.qi-ep__space');
  const plot = space.querySelector('svg');
  const clusters = [...plot.querySelectorAll('g')];
  const buttons = [...node.querySelectorAll('button')];
  let seed = 709;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const centers = [[60, 65], [128, 90], [90, 144]];
  clusters.forEach((group, i) => {
    for (let j = 0; j < 12; j++) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', centers[i][0] + (random() - 0.5) * 46);
      dot.setAttribute('cy', centers[i][1] + (random() - 0.5) * 42);
      dot.setAttribute('r', 3.5);
      group.append(dot);
    }
  });
  function connectors() {
    const bounds = diagram.getBoundingClientRect();
    wireSvg.setAttribute('viewBox', `0 0 ${Math.max(1, bounds.width)} ${Math.max(1, bounds.height)}`);
    const stacked = model.getBoundingClientRect().left < inputs[0].getBoundingClientRect().right;
    function path(source, target, lane) {
      const a = source.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const x1 = a.right - bounds.left;
      const y1 = a.top + a.height / 2 - bounds.top;
      const x2 = (stacked ? b.right : b.left) - bounds.left;
      const y2 = b.top + b.height / 2 - bounds.top;
      const middle = stacked ? bounds.width - 8 - lane * 6 : (x1 + x2) / 2;
      return `M${x1},${y1} H${middle} V${y2} H${x2}`;
    }
    wires.forEach((group, i) => {
      const paths = [...group.children];
      paths[0].setAttribute('d', path(inputs[i], model, i));
      paths[1].setAttribute('d', path(model, vectors[i], i));
      paths[2].setAttribute('d', path(vectors[i], plot, i));
    });
  }
  function select(id) {
    const index = INPUTS.findIndex(input => input.id === id);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.input === id)));
    node.querySelectorAll('[data-kind]').forEach(element => element.classList.toggle('is-active', element.dataset.kind === id));
    wires.forEach((group, i) => group.classList.toggle('is-active', i === index));
    // Draw the active path last where routes share the same gutter.
    wireSvg.append(wires[index]);
    plot.append(clusters[index]);
    plot.setAttribute('aria-label', `Illustrative shared vector space; ${INPUTS[index].name.toLowerCase()} points highlighted.`);
    const descriptions = {
      image: 'Image path selected.',
      document: 'Document path selected.',
      audio: 'Audio path selected.',
    };
    node.querySelector('.qi-status').textContent = descriptions[id];
  }
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.input)));
  new ResizeObserver(connectors).observe(diagram);
  select('document');
  connectors();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
