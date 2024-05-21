import AnchorJS from 'anchor-js';
import { scrollIntoViewWithOffset } from '../helpers';

const anchors = new AnchorJS();
anchors.options.placement = 'left';
anchors.options.class = 'text-decoration-none';

document.addEventListener('DOMContentLoaded', function (event) {
  anchors.add('.qdrant-post__body :is(h1, h2, h3, h4, h5, h6)');
  if (/documentation/.test(window.location?.pathname)) {
    anchors.add('.documentation-article :is(h1, h2, h3, h4, h5, h6)');
  }

  // scroll to anchors:
  let offset = 100;

  if (window.location.hash) {
    scrollIntoViewWithOffset(window.location.hash.replace('#', ''), offset).catch((e) => {
      console.error(e);
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    const target = anchor.getAttribute('href');
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      scrollIntoViewWithOffset(target.replace('#', ''), offset).then(() => {
        history.pushState(null, null, target);
      });
    });
  });
});
