import AnchorJS from 'anchor-js';

const anchors = new AnchorJS();
anchors.options.placement = 'left';
anchors.options.class = 'text-decoration-none';

document.addEventListener('DOMContentLoaded', function (event) {
  anchors.add('.qdrant-post__body :is(h1, h2, h3, h4, h5, h6)');
  if (/documentation/.test(window.location?.pathname)) {
    anchors.add('.documentation-article :is(h1, h2, h3, h4, h5, h6)');
  }
});
