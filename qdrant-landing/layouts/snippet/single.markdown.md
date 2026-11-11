{{- /* Body in partials/markdown-page/snippet-single.md. Rendered once, then published at index.md and its /path.md alias. */ -}}
{{- $out := partial "markdown-cloud-utm.md" (dict "page" . "content" (partial "markdown-page/snippet-single.md" .)) -}}
{{- partial "markdown-alias.html" (dict "page" . "content" $out) -}}
{{- $out -}}
