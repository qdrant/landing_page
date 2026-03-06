# {{ .Title }}

{{- $content := .RenderShortcodes -}}
{{- $content = replaceRE `\]\((/[^):]*/)\)` `](${1}go.md)` $content -}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)\)` `](${1}go.md)` $content -}}
{{ $content }}
