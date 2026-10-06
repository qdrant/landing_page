// Mount the article's static SVGs inline so they inherit the page theme.
let instance = 0;

export async function mount(node) {
  try {
    const image = node.closest('.island').querySelector('.island__fallback img');
    const url = new URL(image.src, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/articles_data/filterable-hnsw/')) {
      throw new Error('Unexpected figure URL');
    }
    if (url.pathname.endsWith('/geohash.png')) url.pathname = url.pathname.replace(/\.png$/, '.svg');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Figure request failed: ${response.status}`);
    const document = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    const svg = document.documentElement;
    if (svg.localName !== 'svg' || document.querySelector('parsererror')) {
      throw new Error('Invalid figure SVG');
    }
    // Each inline instance needs independent description and marker IDs.
    const prefix = `filterable-hnsw-${++instance}-`;
    for (const element of svg.querySelectorAll('[id]')) {
      const oldId = element.id;
      element.id = prefix + oldId;
      for (const reference of svg.querySelectorAll('*')) {
        for (const attribute of reference.attributes) {
          if (attribute.value.includes(`url(#${oldId})`)) {
            reference.setAttribute(attribute.name, attribute.value.replaceAll(`url(#${oldId})`, `url(#${prefix}${oldId})`));
          }
        }
      }
      if (svg.getAttribute('aria-labelledby') === oldId) svg.setAttribute('aria-labelledby', prefix + oldId);
    }
    svg.setAttribute('aria-label', image.alt);
    node.classList.add('filterable-hnsw-figure');
    node.append(svg);
    node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
  } catch (error) {
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
    console.error('Filterable HNSW figure:', error);
  }
}
