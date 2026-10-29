# Documentation part assets

CSS and JS for the documentation part of the site: the `documentation`,
`learn`, `course`, and `articles` sections. Pages in those sections load assets
from this directory only, through `layouts/partials/documentation/css.html`,
`js.html`, and `js-head.html`.

This tree is self-contained on purpose. The marketing part (`assets/css/`,
`assets/js/`) is going to be rewritten, and the documentation must not depend on
it. Rules:

- Import only from this directory or from `node_modules`. Never reach into
  `assets/css/` or `assets/js/`.
- Many files started as copies of marketing files. A fix to one of them, such as
  `js/copy-code.js` or `css/_bootstrap-tools.scss`, has to be made in both trees
  until the marketing rewrite replaces its copy.
- `css/core.scss` and `css/documentation.scss` load on every documentation page.
  `css/articles.scss` loads on top of them in the `articles` section.
