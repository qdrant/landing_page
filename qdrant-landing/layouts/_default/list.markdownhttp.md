# {{ .Title }}

{{- $content := .RenderShortcodes -}}
{{- $content = replaceRE `\]\((/[^):]*/)\)` `](${1}http.md)` $content -}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)\)` `](${1}http.md)` $content -}}
{{ $content }}
