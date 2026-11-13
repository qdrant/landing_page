{{- /* Body in partials/markdown-page/pricing.md. Rendered once, then published at index.md and its /path.md alias. */ -}}
{{- $out := partial "markdown-cloud-utm.md" (dict "page" . "content" (partial "markdown-page/pricing.md" .)) -}}
{{- partial "markdown-alias.html" (dict "page" . "content" $out) -}}
{{- $out -}}
