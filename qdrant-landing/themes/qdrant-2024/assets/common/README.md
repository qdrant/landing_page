# Common third-party assets

Entry points for third-party libraries that both the marketing part
(`assets/css/`, `assets/js/`) and the documentation part (`assets/docs/`) use.
Each one is built once and served from a single URL, so a visitor who moves
between the two parts downloads it once.

| File | Library | Used by (in both parts) |
|---|---|---|
| `js/page-search.js` | `qdrant-page-search`, defines `window.initQdrantSearch` | `js/search/search.js` |
| `js/page-search-scroll.js` | `qdrant-page-search` scroll behavior | loaded directly |
| `css/page-search.scss` | `qdrant-page-search` styles | `css/search/search.scss` overrides it |
| `js/anchor-js.js` | `anchor-js`, exposed as `window.AnchorJS` | `js/vendor/anchor.js` |
| `js/bootstrap-popover.js` | Bootstrap Popover with Popper, exposed as `window.bootstrap.Popover` | `js/copy-code.js`, `js/copy-markdown.js` |

Rules:

- Only third-party code goes here. Our own wrappers and configuration stay in
  each part's tree, duplicated on purpose, so the marketing rewrite can change
  its copy freely.
- A vendor file must load before the part's script that reads its global. The
  wiring is in `layouts/partials/documentation/{css,js}.html` and
  `layouts/partials/marketing/{css,js}.html`.
- Bootstrap SCSS is not here. It compiles together with each part's
  `_theme-variables.scss`, so it stays in each part's `core.scss`.
