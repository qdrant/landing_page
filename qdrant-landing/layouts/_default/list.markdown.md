{{- $content := .RenderShortcodes -}}
{{- if not (strings.TrimSpace $content) }}# {{ .Title }}
{{ end -}}
{{- /* Rewrite internal absolute links: ](/path/to/page/) → ](https://qdrant.tech/path/to/page/index.md) */}}
{{- $content = replaceRE `\]\((/[^):]*/)([\)#?])` `](https://qdrant.tech${1}index.md${2}` $content -}}
{{- /* Rewrite internal relative links: ](../page/) or (./page/) → same with index.md */}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)([\)#?])` `](https://qdrant.tech/${1}index.md${2}` $content -}}
{{ $content }}