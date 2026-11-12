# Shortcode assets

Styles and scripts that belong to a content shortcode, kept with the shortcode
instead of in either part's theme. Shortcodes render inside page content in the
documentation part, in the marketing part, and in the new marketing theme, so
their assets must not depend on any of them.

A page loads a shortcode's assets only when it uses that shortcode.

## Layout

```
assets/shortcodes/
  _content-list.scss       .list body styles, used by accordion and course-card
  _qi-tokens.scss          --qi-* custom properties, used by chart and island
  <name>/<name>.scss       styles for the shortcode, optional
  <name>/<name>.js         behavior for the shortcode, optional
layouts/shortcodes/<name>.html         the template
layouts/partials/common/shortcode-assets/     names.html, css.html, js.html
```

## Shortcodes with assets

| Shortcode | CSS | JS | Loaded by | Example page |
|---|---|---|---|---|
| `accordion` | yes | yes | marker | `/documentation/cloud/cluster-monitoring/` |
| `cards-list` | yes | | marker | `/course/multi-vector-search/` |
| `code-snippet` | yes | yes | marker, only the deployment-type variant | `/documentation/search/text-search/` |
| `course-card` | yes | | marker | `/course/` |
| `date` | yes | | marker | `/course/multi-vector-search/module-2/` |
| `prompt` | yes | | marker | `/documentation/agentic-tools/` |
| `quote` | yes | | marker | `/blog/case-study-poliscope/` |
| `chart` | yes | yes | `.HasShortcode "chart"` | |
| `island` | yes | yes | `.HasShortcode "island"` | |

The example pages are in `SHORTCODE_ROUTES` in `qdrant-landing/tests/routes.ts`.

## How loading works

1. The shortcode puts `data-shortcode="<name>"` on its root element.
2. `partials/common/shortcode-assets/names.html` reads the page's rendered `.Content`
   and returns the names it finds. Calling `.Content` in `<head>` renders the
   content early; Hugo caches it, so the body reuses the same result.
3. `common/shortcode-assets/css.html` links `<name>/<name>.scss` for each name, right
   after the part's `core.css` and before its section bundle.
   `common/shortcode-assets/js.html` adds `<name>/<name>.js` after `lang-switcher.js`.
   A missing file is skipped, so a shortcode can have CSS only, JS only, or
   neither.

Both parts' `css.html` and `js.html` call these partials, and the new theme
should call them too. Adding a shortcode never means editing those templates.

`chart` and `island` still load through `.HasShortcode`, as they did before this
layer existed. Their assets live here, but the wiring is in each part's
`css.html` and `js.html`.

## Rules

- **Styles import only from `shortcodes/`, `lib/`, or `node_modules`.** Start
  with `@use '../../lib/tools' as *;`. Never import a part's `_bootstrap-tools`,
  `_theme-variables`, or anything else under `assets/marketing/` or
  `assets/docs/`.
- **Add a value to `lib/_tools.scss` instead of reaching for a theme variable.** Its
  values were copied from the themes when the shortcodes moved out. Changing
  one changes the shortcode everywhere it renders.
- **Light mode keys off `[data-theme='light']` on `<html>`.** That attribute is
  the only thing a shortcode may assume about the page. Write those rules out
  longhand at the root of the file; see the `[data-theme]` trap in `AGENTS.md`.
- **Class names that only a shortcode uses belong to it.** Before moving styles
  here, check that no layout partial or script uses the class.
- **Scripts run at the end of `<body>`.** They can query the DOM directly or
  wait for `DOMContentLoaded`.
- **The marker must reach `.Content`.** A shortcode used in content that a
  layout renders some other way, for example a headless page rendered by a
  partial, is not detected.

## Known limits

- The marker also appears in the agent-facing `index.md` of shortcodes that
  have no `<name>.markdown.md` variant, because Hugo renders the HTML template
  into Markdown output. It is harmless there.
- `course-card` and `prompt` still use classes from the page theme: `button`,
  `button_contained`, `button_sm`, and the `.highlight` code block styles.
  Under a theme that does not define them, those parts render unstyled.
- `integration-directory` keeps its script in the documentation part. It is
  built from documentation components (`docs-card`) and shares `filter-form.js`
  with other documentation scripts.
