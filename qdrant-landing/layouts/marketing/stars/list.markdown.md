{{- /* Body in partials/markdown-page/stars.md. Rendered once, then published at index.md and its /path.md alias. */ -}}
{{- $out := partial "markdown-page/stars.md" . -}}
{{- partial "markdown-alias.html" (dict "page" . "content" $out) -}}
{{- $out -}}
