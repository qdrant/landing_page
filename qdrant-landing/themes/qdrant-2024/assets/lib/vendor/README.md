# Third-party wrappers

Entry points for third-party libraries that both parts use. Each one is built
once and served from a single URL, so a visitor who moves between the parts
downloads it once.

| File | Library | Read by |
|---|---|---|
| `page-search.js` | `qdrant-page-search`, defines `window.initQdrantSearch` | each part's `js/search/search.js` |
| `page-search-scroll.js` | `qdrant-page-search` scroll behavior | loaded directly |
| `page-search.scss` | `qdrant-page-search` styles | each part's `css/search/search.scss` overrides it |
| `bootstrap-popover.js` | Bootstrap Popover with Popper, exposed as `window.bootstrap.Popover` | `lib/code-blocks/copy-code.js`, each part's `js/copy-markdown.js` |

## Rules

- **Only third-party code goes here.** Our own wrappers and configuration live
  in the part or the `lib/` component that uses them.
- **A vendor file loads before the script that reads its global.** The wiring
  is in `layouts/partials/documentation/{css,js}.html` and
  `layouts/partials/marketing/{css,js}.html`.
- **A library used by one file only does not need a wrapper.** Import it
  directly, as `lib/heading-anchors/heading-anchors.js` does with `anchor-js`.
- **Bootstrap SCSS is not here.** It compiles together with each part's
  `_theme-variables.scss`, so it stays in each part's `core.scss`.
