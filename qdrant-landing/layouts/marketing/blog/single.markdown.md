{{- /* Body in partials/markdown-page/blog-single.md. Rendered once, then published at index.md and its /path.md alias. */ -}}
{{- $out := partial "markdown-page/blog-single.md" . -}}
{{- partial "markdown-alias.html" (dict "page" . "content" $out) -}}
{{- $out -}}
