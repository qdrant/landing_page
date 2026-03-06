# {{ .Title }}

{{- $content := .RenderShortcodes -}}
{{- $content = replaceRE `\]\((/[^):]*/)\)` `](${1}index.md)` $content -}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)\)` `](${1}index.md)` $content -}}
{{ $content }}
