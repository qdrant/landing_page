# Copy as Markdown

The "Copy as Markdown" button. It copies the page's own Markdown output (the
`index.md` that agents read), not a conversion of the rendered HTML. It lives
in `lib/` because nothing in it belongs to either part: the documentation part
renders it today, and the marketing part keeps the script wired so it works if
a marketing page renders it.

| File | What it does |
|---|---|
| `copy-markdown.js` | Prefetches the Markdown when the pointer or focus reaches the button, writes it to the clipboard on click, and confirms with a Bootstrap popover and a live region. |
| `copy-markdown.scss` | The outlined button and its `idle`, `loading`, and `done` states, light and dark. |

## How a part uses it

Three partials in `layouts/partials/common/copy-markdown/`:

- `button.html` renders the button where a layout wants it. It renders nothing
  for a page without a Markdown output format, and otherwise sets the page's
  `hasCopyMarkdown` flag.
- `css.html`, after the stylesheets that restyle the button in place, so those
  overrides keep winning ties. Renders nothing for a page without a Markdown
  output format.
- `js.html`, after the page body. Loads only when `hasCopyMarkdown` is set.
  Needs `window.bootstrap.Popover`, so the part loads
  `lib/vendor/bootstrap-popover.js` first, as for `code-blocks/`.

| Part | Where the button renders | CSS | JS |
|---|---|---|---|
| Documentation | the article header (`documentation/content-layout.html`, `documentation/page-top.html`) and the table of contents on `documentation`, `articles`, and `course` pages (`common/table-of-contents.html`) | every page with a Markdown output, right after `documentation.css` | pages that render the button |
| Marketing | nowhere today | not called | pages that render the button |

The documentation part restyles the button where it sits, in
`docs/css/partials/_table-of-contents.scss` and
`docs/css/partials/documentation/_documentation-article.scss`. The marketing
part's `_table-of-contents.scss` has a copy of the table of contents rules.

## Rules

- Styles import only `../tools`. Never a part's theme.
- The markup contract is `.js-copy-markdown`, `data-copy-markdown-src`,
  `.copy-markdown__status`, and `data-state` (`idle`, `loading`, `done`). A
  change to it is a change to `button.html`, `copy-markdown.js`,
  `copy-markdown.scss`, and the restyling rules in the parts.
- To replace the button in a part, stop calling these partials there and call
  the replacement instead.
