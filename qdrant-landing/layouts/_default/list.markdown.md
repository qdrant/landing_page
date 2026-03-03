# {{ .Title }}

{{- $content := .RawContent -}}
{{- /* Rewrite internal absolute links: ](/path/to/page/) → ](/path/to/page/index.md) */}}
{{- $content = replaceRE `\]\((/[^):]*/)` `](${1}index.md` $content -}}
{{- /* Rewrite internal relative links: ](../page/) or (./page/) → same with index.md */}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)` `](${1}index.md` $content -}}
{{ $content }}