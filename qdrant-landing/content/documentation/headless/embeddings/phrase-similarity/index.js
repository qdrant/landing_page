// Measured, quantized embeddings are supplied by phrases.json, not generated here.
export async function mount(node) {
  try {
    const response = await fetch('/articles_data/what-are-embeddings/phrases.json');
    if (!response.ok) throw new Error(`Phrase data request failed: ${response.status}`);
    const data = await response.json();
    if (data.dims !== 384 || data.phrases.length !== 4 || data.vectors.length !== 5 ||
        data.vectors.some(vector => vector.length !== data.dims || vector.some(value => !Number.isFinite(value))) ||
        data.phrases.some(phrase => typeof phrase.text !== 'string' || !Number.isFinite(phrase.cos))) {
      throw new Error('Invalid phrase embedding data');
    }
    render(node, data);
  } catch {
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
  }
}

function render(node, data) {
  node.classList.add('qi-ps');
  node.innerHTML = `<div class="qi-fig">
    <div class="qi-controls"><div class="qi-group" role="group" aria-label="Comparison phrase"></div></div>
    <div class="qi-ps__row"><p class="qi-ps__anchor"></p><svg class="qi-svg qi-ps__strip" viewBox="0 0 384 40" preserveAspectRatio="none" role="img"></svg></div>
    <div class="qi-ps__row"><p class="qi-ps__comparison"></p><svg class="qi-svg qi-ps__strip" viewBox="0 0 384 40" preserveAspectRatio="none" role="img"></svg></div>
    <div class="qi-ps__summary"><span class="qi-ps__score"></span><meter min="-1" max="1" value="0" aria-label="Cosine similarity"></meter></div>
    <div class="qi-ps__legend"><span><i class="qi-chip__swatch qi-ps__positive" aria-hidden="true"></i>positive</span><span><i class="qi-chip__swatch qi-ps__negative" aria-hidden="true"></i>negative</span><span>all 384 values of all-MiniLM-L6-v2</span></div>
    <p class="qi-status qi-status--2" role="status" aria-live="polite" aria-atomic="true"></p>
  </div>`;
  const group = node.querySelector('.qi-group');
  const strips = [...node.querySelectorAll('.qi-ps__strip')];
  const status = node.querySelector('.qi-status');
  const meter = node.querySelector('meter');
  const buttons = data.phrases.map((phrase, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'qi-chip';
    button.textContent = phrase.text;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => select(i));
    group.append(button);
    return button;
  });
  node.querySelector('.qi-ps__anchor').textContent = data.anchor;
  // One cell per dimension; no sorting, thinning, or aggregation on small screens.
  function strip(svg, vector, phrase) {
    svg.setAttribute('aria-label', `${phrase}: all ${data.dims} embedding values in dimension order. Red is positive; violet is negative; intensity indicates magnitude.`);
    svg.replaceChildren(...vector.map((value, i) => {
      const cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      for (const [key, attr] of Object.entries({ x: i, y: 0, width: 1, height: 40,
        fill: value >= 0 ? 'var(--ps-positive)' : 'var(--ps-negative)',
        'fill-opacity': Math.min(1, Math.abs(value) / 200) })) cell.setAttribute(key, attr);
      return cell;
    }));
  }
  function select(i) {
    const phrase = data.phrases[i];
    const score = phrase.cos.toFixed(2);
    buttons.forEach((button, j) => button.setAttribute('aria-pressed', String(i === j)));
    node.querySelector('.qi-ps__comparison').textContent = phrase.text;
    strip(strips[1], data.vectors[i + 1], phrase.text);
    node.querySelector('.qi-ps__score').textContent = `Cosine similarity ${score}`;
    meter.value = phrase.cos;
    meter.setAttribute('aria-valuetext', `${score}, ${phrase.text} compared with ${data.anchor}`);
    status.textContent = `Cosine similarity ${score}: ${phrase.cos >= 0.5 ? 'similar meaning gives a similar pattern.' : phrase.cos <= 0.3 ? 'different meaning gives a different pattern.' : 'partly related meaning gives a partly similar pattern.'}`;
  }
  strip(strips[0], data.vectors[0], data.anchor);
  const initial = data.phrases.findIndex(phrase => phrase.text === 'cotton-made maritime shirt');
  select(initial >= 0 ? initial : 0);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
