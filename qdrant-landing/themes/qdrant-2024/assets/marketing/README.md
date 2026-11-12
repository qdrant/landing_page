# Marketing part assets

CSS and JS for every page outside the documentation part, including the blog.
They load through `layouts/partials/marketing/css.html`, `js.html`, and
`js-head.html`.

Rules:

- **Import only from `marketing/`, `lib/`, or `node_modules`.** Never from
  `docs/` or `shortcodes/`.
- **Files that also exist in `docs/` are deliberate copies.** A fix to one goes
  into both.
- **`css/core.scss` plus one section bundle per page.** The section-to-bundle
  mapping is in `partials/marketing/css.html`.

This tree is expected to be replaced by a rewrite of the marketing part. Code
the rewrite will also need, such as analytics, belongs in `lib/`.
