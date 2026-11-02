# Part-neutral assets

Code that both the marketing and the documentation part use, and that belongs
to neither. Files here import only from `lib/` and `node_modules`.

| Path | What it is | Loaded through |
|---|---|---|
| `_tools.scss` | Sass values, `pxToRem`, and breakpoint mixins. Emits no CSS. Used by every stylesheet in `lib/` and `shortcodes/` instead of a part's theme variables. | imported |
| `analytics/` | Tracking and consent: HubSpot, OneTrust, Segment, Google | `partials/analytics/{head,body}.html`, called by every theme |
| `code-blocks/` | Syntax highlighting, copy button, language tabs | `partials/code-blocks/{css,js}.html` |
| `heading-anchors/` | The `#` link next to post and documentation headings | `partials/heading-anchors/{css,js}.html` |
| `vendor/` | Third-party libraries exposed as globals for each part's own wrappers | each part's `css.html` and `js.html` |

Each component has its own README.

## Rules

- **No part's look or theme.** If a file needs a part's theme variables, layout
  classes, or behavior, it belongs in that part.
- **Values come from `_tools.scss`.** Its values were copied from the themes
  when the code moved here, so the compiled CSS did not change. A change to a
  value changes every component and shortcode that uses it.
- **Components are swappable.** A part uses a component by calling its partials,
  and stops using it by calling something else. Do not reach into a component's
  files from a part.
