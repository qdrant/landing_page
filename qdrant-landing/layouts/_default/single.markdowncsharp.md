# {{ .Title }}

{{- $content := .RenderShortcodes -}}
{{- $content = replaceRE `\]\((/[^):]*/)\)` `](${1}csharp.md)` $content -}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)\)` `](${1}csharp.md)` $content -}}
{{ $content }}
