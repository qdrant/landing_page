// Symptoms select places to inspect, not a verdict on which component failed.
const NS = 'http://www.w3.org/2000/svg';
let instance = 0;
const CASES = [
  {
    symptom: 'Answer loses support', recall: 'High', faithfulness: 'Low',
    inspect: ['generator', 'judge'], routes: ['generation', 'judging'],
    heading: 'Inspect the generator, then the judge',
    detail: 'Retrieval met its target. Compare the unsupported claims with the passages and the prompt, then read the faithfulness verdicts: the judge may have rejected valid support spread across several passages.',
  },
  {
    symptom: 'Evidence and support drop', recall: 'Low', faithfulness: 'Low',
    inspect: ['retriever', 'generator'], routes: ['retrieval', 'generation'],
    heading: 'Inspect retrieval, then generation',
    detail: 'Look for the missing evidence and the retrieval setting that lost it, such as the embedding model, chunking, or filters. Then look for unsupported claims in the answer. The labels can also miss useful evidence that retrieval found.',
  },
  {
    symptom: 'Low recall, supported answer', recall: 'Low', faithfulness: 'High',
    inspect: ['labels', 'retriever'], routes: ['labeling', 'retrieval'],
    heading: 'Inspect the labels, then retrieval',
    detail: 'Useful evidence may be missing from the labels, and more than 10 labeled passages can put the recall target out of reach. If the labels hold up, check which passages retrieval missed and why.',
  },
  {
    // Passing the primary scores still leaves ranking, relevancy, and correctness
    // to inspect. All relevant metrics should be collected for every run.
    symptom: 'Both scores meet target', recall: 'High', faithfulness: 'High',
    inspect: ['passages', 'answer', 'reference'], routes: ['correctness'],
    heading: 'Inspect ranking, relevancy, and correctness',
    detail: '1. Low context_precision: check whether supporting passages rank below irrelevant ones.\n'
      + '2. Low answer_relevancy: look for evasive, off-topic, or padded answers. Correct refusals score low too.\n'
      + '3. Compare with reference answers using FactualCorrectness and review a sample: the passages can be wrong.',
  },
];

function element(tag, attributes = {}, text) {
  const result = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes)) result.setAttribute(name, value);
  if (text !== undefined) result.textContent = text;
  return result;
}

function label(parent, x, y, text, className = '') {
  parent.append(element('text', { x, y, class: `qi-diagnosis__label ${className}`, 'text-anchor': 'middle' }, text));
}

export function mount(node) {
  node.classList.add('qi-diagnosis', 'qi-fig');
  const arrowId = `qi-diagnosis-arrow-${++instance}`;
  node.innerHTML = `
    <div class="qi-diagnosis__symptoms" role="group" aria-label="Choose a RAG symptom">
      ${CASES.map((item, index) => `<button type="button" class="qi-chip qi-diagnosis__symptom" data-case="${index}" aria-pressed="false">
        <span>${item.symptom}</span><small>${item.recall} recall · ${item.faithfulness} faithfulness</small>
      </button>`).join('')}
    </div>
    <div class="qi-diagnosis__system"></div>
    <div class="qi-diagnosis__finding">
      <span class="qi-diagnosis__eyebrow">Where to inspect</span>
      <div class="qi-diagnosis__details">
        <div class="qi-status" role="status" aria-live="polite" aria-atomic="true"><strong></strong><p></p></div>
        ${CASES.map((item) => `<div class="qi-status qi-diagnosis__reserve" aria-hidden="true"><strong>${item.heading}</strong><p>${item.detail}</p></div>`).join('')}
      </div>
    </div>`;
  const system = node.querySelector('.qi-diagnosis__system');
  const status = node.querySelector('[role="status"]');
  const buttons = [...node.querySelectorAll('button')];
  let selected = 0;
  let narrow;

  function render() {
    narrow = node.getBoundingClientRect().width < 520;
    const item = CASES[selected];
    const svg = element('svg', {
      class: 'qi-svg', viewBox: narrow ? '0 0 358 552' : '0 0 712 360', role: 'img',
      'aria-label': `${item.recall} recall, ${item.faithfulness.toLowerCase()} faithfulness. ${item.heading}. The pipeline runs from the question through Qdrant, retrieved passages, and the generator to the answer. Labels and the judge are evaluation checkpoints; reference answers check correctness. Numbered components show the inspection order.`,
    });
    const defs = element('defs');
    const marker = element('marker', { id: arrowId, viewBox: '0 0 8 8', refX: 8, refY: 4, markerWidth: 6, markerHeight: 6, orient: 'auto' });
    marker.append(element('path', { d: 'M0 0L8 4L0 8Z', class: 'qi-diagnosis__arrow' }));
    defs.append(marker);
    svg.append(defs);

    const nodes = narrow ? [
      ['question', 158, 20, 178, 'Question', 'input'],
      ['retriever', 158, 112, 178, 'Qdrant', 'retriever'],
      ['passages', 158, 204, 178, 'Top 10', 'passages'],
      ['generator', 158, 296, 178, 'Generator', 'LLM + prompt'],
      ['answer', 158, 388, 178, 'Answer', 'claims'],
      ['labels', 8, 112, 120, 'Labels', 'expected evidence'],
      ['judge', 8, 296, 120, 'Judge', 'support verdict'],
      ['reference', 108, 490, 228, 'Reference answer', 'correctness check'],
    ] : [
      ['question', 16, 166, 84, 'Question', 'input'],
      ['retriever', 124, 166, 128, 'Qdrant', 'retriever'],
      ['passages', 276, 166, 144, 'Top 10', 'passages'],
      ['generator', 444, 166, 126, 'Generator', 'LLM + prompt'],
      ['answer', 594, 166, 102, 'Answer', 'claims'],
      ['labels', 124, 28, 154, 'Labels', 'expected evidence'],
      ['judge', 488, 28, 208, 'Judge', 'support verdict'],
      ['reference', 488, 290, 208, 'Reference answer', 'correctness check'],
    ];
    function route(d, name, arrow = false) {
      const active = item.routes.includes(name);
      svg.append(element('path', {
        d, class: `qi-diagnosis__route${active ? ' qi-diagnosis__route--active' : ''}${arrow ? '' : ' qi-diagnosis__route--check'}`,
        ...(arrow ? { 'marker-end': `url(#${arrowId})` } : {}),
      }));
    }
    if (narrow) {
      route('M247 80V112', 'input', true);
      route('M247 172V204', 'retrieval', true);
      route('M247 264V296', 'context', true);
      route('M247 356V388', 'generation', true);
      route('M68 172V234H158', 'labeling');
      route('M158 246H144V326H128', 'judging');
      route('M158 418H144V338H128', 'judging');
      route('M247 448V490', 'correctness');
    } else {
      route('M100 196H124', 'input', true);
      route('M252 196H276', 'retrieval', true);
      route('M420 196H444', 'context', true);
      route('M570 196H594', 'generation', true);
      route('M201 88V120H348V166', 'labeling');
      route('M396 166V104H529V88', 'judging');
      route('M645 166V104H609V88', 'judging');
      route('M645 226V264H592V290', 'correctness');
      label(svg, 181, 150, 'retrieval', 'qi-diagnosis__section');
      label(svg, 507, 150, 'generation', 'qi-diagnosis__section');
    }
    nodes.forEach(([id, x, y, width, title, subtitle]) => {
      const order = item.inspect.indexOf(id);
      const group = element('g', { class: `qi-diagnosis__organ${order >= 0 ? ' qi-diagnosis__organ--active' : ''}` });
      svg.append(group);
      group.append(element('rect', { x, y, width, height: 60, rx: ['retriever', 'generator', 'judge'].includes(id) ? 12 : 3, class: 'qi-diagnosis__body' }));
      label(group, x + width / 2, y + 26, title, 'qi-diagnosis__name');
      label(group, x + width / 2, y + 46, subtitle, narrow && ['labels', 'judge'].includes(id) ? 'qi-diagnosis__small' : '');
      if (order >= 0) {
        group.append(element('circle', { cx: x + width - 5, cy: y + 2, r: 12, class: 'qi-diagnosis__number-bg' }));
        label(group, x + width - 5, y + 7, String(order + 1), 'qi-diagnosis__number');
      }
    });
    system.replaceChildren(svg);
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(selected === index)));
    status.querySelector('strong').textContent = item.heading;
    status.querySelector('p').textContent = item.detail;
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    if (selected === index) return;
    selected = index;
    render();
  }));
  render();
  new ResizeObserver(() => {
    if ((node.getBoundingClientRect().width < 520) !== narrow) render();
  }).observe(node);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
