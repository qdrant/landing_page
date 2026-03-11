# {{ .Title }}

{{- $content := .RenderShortcodes -}}
{{- $content = replaceRE `\]\((/[^):]*/)\)` `](${1}typescript.md)` $content -}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)\)` `](${1}typescript.md)` $content -}}
{{ $content }}
