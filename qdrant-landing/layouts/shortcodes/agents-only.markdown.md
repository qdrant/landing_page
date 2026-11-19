{{- /*
  agents-only (Markdown output variant): emit the inner content as is, so it
  appears in index.md. The HTML variant renders nothing.
*/ -}}
{{ trim .Inner "\n" }}
