{{- /* Body in partials/markdown-page/articles-list.md. Rendered once, then published at index.md and its /path.md alias. */ -}}
{{- $out := partial "markdown-page/articles-list.md" . -}}
{{- partial "markdown-alias.html" (dict "page" . "content" $out) -}}
{{- $out -}}
