{{- /* Body in partials/markdown-page/documentation-guides.md. Rendered once, then published at index.md and its /path.md alias. */ -}}
{{- $out := partial "markdown-cloud-utm.md" (dict "page" . "content" (partial "markdown-page/documentation-guides.md" .)) -}}
{{- partial "markdown-alias.html" (dict "page" . "content" $out) -}}
{{- $out -}}
