// Mount a static geo search SVG inline so it follows the page theme. The shortcode's
// fallback image is the same SVG, so without JS the reader sees it as an image.
export async function mount(node) {
  try {
    const image = node.closest('.island').querySelector('.island__fallback img');
    const url = new URL(image.src, window.location.href);
    if (
      url.origin !== window.location.origin ||
      !url.pathname.startsWith('/docs/geo-search-') ||
      !url.pathname.endsWith('.svg')
    ) {
      throw new Error('Unexpected figure URL');
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Figure request failed: ${response.status}`);
    const document = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    const svg = document.documentElement;
    if (svg.localName !== 'svg' || document.querySelector('parsererror')) {
      throw new Error('Invalid figure SVG');
    }
    // The figures have no ids to keep unique, only a title referenced by aria-labelledby.
    svg.removeAttribute('aria-labelledby');
    svg.querySelector('title')?.remove();
    svg.setAttribute('aria-label', image.alt);
    node.classList.add('geo-figure');
    node.append(svg);
    node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
  } catch (error) {
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
    console.error('Geo search figure:', error);
  }
}
