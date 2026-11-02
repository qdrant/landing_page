# Code blocks

Everything that makes a code block look and behave like one: Chroma syntax
highlighting, the copy button, and the language tabs. Shared by the
documentation and the marketing part, so each fix lands once.

| File | What it does |
|---|---|
| `code-blocks.scss` | Entry point. Pulls in the three partials in their old `core.css` order. |
| `_copy-btn.scss` | The copy button that `copy-code.js` adds to each `.highlight` block. |
| `_lang-switcher.scss` | The language tabs that `lang-switcher.js` builds. |
| `_syntax-highlight.scss` | Chroma token colors, light and dark. |
| `copy-code.js` | Adds copy buttons to `.highlight` blocks, and wires `.js-copy-code` code windows (`partials/code-window.html`). |
| `lang-switcher.js` | Groups consecutive code blocks into language tabs and remembers the choice. |

The markup comes from Hugo: fenced code in Markdown and the `highlight`
function both produce Chroma's `.highlight > pre > code`.

## How a part uses it

Two partials, called by each part where it wants them:

- `layouts/partials/code-blocks/css.html`, right after the part's `core.css`.
- `layouts/partials/code-blocks/js.html`, after `common/js/bootstrap-popover.js`,
  which `copy-code.js` needs.

| Part | CSS | JS |
|---|---|---|
| Documentation | every page | every page |
| Marketing | every page (where `core.css` used to deliver it) | the sections in `$copyCodeSections` in `partials/marketing/js.html` |

## Replacing code blocks in the marketing part

1. In `partials/marketing/css.html` and `partials/marketing/js.html`, replace
   the two `code-blocks/*` partial calls with the replacement's own.
2. Restyle the code windows on the marketing landing pages (edge, cloud,
   quantization, industries). Their section stylesheets style `.highlight`
   themselves, and `partials/code-window.html` relies on `copy-code.js` through
   the `.js-copy-code` markup.
3. Check what still renders Chroma markup inside marketing content: the
   `code-snippet` and `prompt` shortcodes (`assets/shortcodes/`) style
   `.highlight` and expect `lang-switcher.js` and `copy-code.js`.

The documentation keeps calling these partials, so nothing changes there.

## Rules

- Styles import only `../shortcodes/tools` and each other. Never a part's
  theme. Add missing values to `assets/shortcodes/_tools.scss`.
- Selectors stay generic (`.highlight`, `.chroma`, `.copy-code`, `.lang-tabs`)
  because the markup is Hugo's. Section-specific looks belong in that
  section's stylesheet, as the marketing landing pages do.
