export function mount(node) {
  node.classList.add('rg');
  node.innerHTML = `<div class="qi-controls" role="group" aria-label="Highlight a dataset">${series.map((s,i) => `<button class="qi-chip" data-select="${i}" aria-pressed="false"><span class="qi-chip__swatch" style="background:${s.color}"></span>${s.name}</button>`).join('')}<button class="qi-chip" data-reset>Show all</button></div><div class="rg-plot"></div><p class="qi-status" role="status" aria-live="polite"></p>`;
  const plot = node.querySelector('.rg-plot');
  const status = node.querySelector('.qi-status');
  const buttons = Array.from(node.querySelectorAll('[data-select]'));
  let selected = null;
  function update(active = selected, point = null) {
    plot.querySelectorAll('[data-series]').forEach(group => {
      group.classList.toggle('rg-active', Number(group.dataset.series) === active);
    });
    buttons.forEach((button,i) => button.setAttribute('aria-pressed', String(i === selected)));
    if (active === null) status.textContent = 'Hover a line or select a dataset. Zero is the tuned-fusion baseline.';
    else {
      const s = series[active];
      status.textContent = point === null
        ? `${s.name}: ${format(s.values.at(-1))} nDCG@10 change at 200 candidates.`
        : `${s.name}: ${format(s.values[point])} nDCG@10 change at ${counts[point]} candidates.`;
    }
  }
  buttons.forEach((button,i) => {
    button.addEventListener('click', () => {selected = selected === i ? null : i; update();});
    button.addEventListener('pointerenter', () => update(i));
    button.addEventListener('pointerleave', () => update());
    button.addEventListener('focus', () => update(i));
    button.addEventListener('blur', () => update());
  });
  node.querySelector('[data-reset]').addEventListener('click', () => {selected = null; update();});
  function render() {
    // Drawing at the actual column width keeps labels readable on phones.
    plot.innerHTML = drawing(series, Math.max(280, Math.min(760, Math.round(plot.clientWidth))));
    plot.querySelectorAll('[data-series]').forEach(group => {
      const index = Number(group.dataset.series);
      group.addEventListener('pointerenter', () => update(index));
      group.addEventListener('pointerleave', () => update());
      group.querySelectorAll('[data-point]').forEach(point => {
        const countIndex = Number(point.dataset.point);
        const show = () => update(index, countIndex);
        point.addEventListener('pointerenter', show);
        point.addEventListener('focus', show);
        point.addEventListener('blur', () => update());
        point.addEventListener('click', () => {selected = index; show();});
        point.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); selected = index; show();}
        });
      });
    });
    update();
  }
  render();
  let lastWidth = plot.clientWidth;
  new ResizeObserver(() => {
    if (plot.clientWidth !== lastWidth) {lastWidth = plot.clientWidth; render();}
  }).observe(plot);
  node.dispatchEvent(new CustomEvent('island:ready', {bubbles:true}));
}
