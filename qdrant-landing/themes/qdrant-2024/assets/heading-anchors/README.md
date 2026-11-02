# Heading anchors

The `#` link next to headings on posts and documentation pages. Clicking it
copies the heading's URL and shows a short "Copied" toast. Shared by the
documentation and the marketing part.

| File | What it does |
|---|---|
| `heading-anchors.js` | Adds the links with the `anchor-js` library to headings in `.qdrant-post__body` (blog, articles, benchmarks posts) and `.documentation-article`, and copies the URL on click. |
| `heading-anchors.scss` | The "Copied" toast. |

## How a part uses it

Two partials, called by each part where it wants them:

- `layouts/partials/heading-anchors/css.html`, after `code-blocks/css.html`.
- `layouts/partials/heading-anchors/js.html`.

| Part | CSS | JS |
|---|---|---|
| Documentation | every page | every page |
| Marketing | every page (where `core.css` used to deliver it) | the sections in `$copyCodeSections` in `partials/marketing/js.html` |

To replace heading anchors in the marketing part, swap those two partial calls in
`partials/marketing/` for the replacement's own. The documentation keeps
calling these.

## Rules

- Styles import only `../shortcodes/tools`. Never a part's theme.
- `anchor-js` is imported directly from `node_modules`. This is the only file
  that uses it, so it does not need a global in `assets/common/`.
