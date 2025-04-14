import AnchorJS from 'anchor-js';
import { scrollIntoViewWithOffset } from '../helpers';
import { DOCS_HEADER_OFFSET } from '../constants';

const anchors = new AnchorJS();
anchors.options.placement = 'left';
anchors.options.class = 'text-decoration-none';

document.addEventListener('DOMContentLoaded', function (event) {
  anchors.add('.qdrant-post__body :is(h1, h2, h3, h4, h5, h6)');
  if (/documentation|articles/.test(window.location?.pathname)) {
    anchors.add('.documentation-article > :is(h1, h2, h3, h4, h5, h6)');
  }

  // scroll to anchors:
  let offset = DOCS_HEADER_OFFSET;

  if (window.location.hash) {
    scrollIntoViewWithOffset(window.location.hash.replace('#', ''), offset);
  }

  let allLinks = document.querySelectorAll('a[href^="#"]');

  allLinks.forEach((anchor) => {
    const target = anchor.getAttribute('href');
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      history.pushState(null, null, target);
      scrollIntoViewWithOffset(target.replace('#', ''), offset);
    });
  });
});
