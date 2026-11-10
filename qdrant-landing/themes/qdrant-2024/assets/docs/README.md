# Documentation part assets

CSS and JS for the documentation part of the site: the `documentation`,
`learn`, `course`, and `articles` sections. They load through
`layouts/partials/documentation/css.html`, `js.html`, and `js-head.html`.

This tree must not depend on the marketing part, which is going to be
rewritten. Rules:

- **Import only from `docs/`, `lib/`, or `node_modules`.** Never from
  `marketing/` or `shortcodes/`.
- **Many files are deliberate copies of marketing files,** such as
  `js/helpers.js` or `css/_bootstrap-tools.scss`. A fix to one goes into both
  until the marketing rewrite replaces its copy.
- **Code that is the same in both parts and belongs to neither goes in `lib/`,**
  not here. See `assets/README.md`.

`css/core.scss` and `css/documentation.scss` load on every documentation page.
`css/articles.scss` loads on top of them in the `articles` section.
