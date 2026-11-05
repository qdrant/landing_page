# Theme assets

CSS and JS for qdrant.tech, grouped by who owns them. There are four
directories and nothing else:

| Directory | Owner | What it holds |
|---|---|---|
| `lib/` | nobody in particular | Part-neutral code: analytics and consent, code blocks, heading anchors, third-party wrappers, shared Sass values |
| `shortcodes/` | the shortcode | Styles and scripts for content shortcodes, loaded only where a shortcode is used |
| `marketing/` | the marketing part | Everything outside the documentation part, including the blog |
| `docs/` | the documentation part | The `documentation`, `learn`, `course`, and `articles` sections |

## Dependencies point toward `lib/`

| Files in | May import from |
|---|---|
| `lib/` | `lib/`, `node_modules` |
| `shortcodes/` | `shortcodes/`, `lib/`, `node_modules` |
| `marketing/` | `marketing/`, `lib/`, `node_modules` |
| `docs/` | `docs/`, `lib/`, `node_modules` |

`marketing/` and `docs/` never import from each other, so the marketing part
can be rewritten without touching the documentation. Files that exist in both,
such as `js/helpers.js` or `css/_bootstrap-tools.scss`, are deliberate copies:
a fix goes into both until the marketing rewrite replaces its copy.

Nothing imports from `shortcodes/` except shortcodes. Templates load shortcode
assets; see `shortcodes/README.md`.

## Where the templates load them

| Assets | Template |
|---|---|
| `marketing/` | `layouts/partials/marketing/{css,js,js-head}.html` |
| `docs/` | `layouts/partials/documentation/{css,js,js-head}.html` |
| `lib/analytics/` | `layouts/partials/common/analytics/{head,body}.html` |
| `lib/code-blocks/` | `layouts/partials/common/code-blocks/{css,js}.html` |
| `lib/copy-markdown/` | `layouts/partials/common/copy-markdown/{button,css,js}.html` |
| `lib/heading-anchors/` | `layouts/partials/common/heading-anchors/{css,js}.html` |
| `lib/vendor/` | each part's own `css.html` and `js.html` |
| `shortcodes/` | `layouts/partials/common/shortcode-assets/{css,js}.html` |

`layouts/partials/common/is-docs-part.html` decides which part a page belongs to.

## Adding a file

- Used by one part only: put it in that part's tree.
- Used by both parts and part-neutral (no part's look, layout, or theme
  variables): put it in `lib/`, as a component with its own partials if a part
  might want to swap it.
- Third-party code both parts need: wrap it in `lib/vendor/`.
- Styles or script for one shortcode: `shortcodes/<name>/`. See the
  `shortcodes` agent skill.
