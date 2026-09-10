# Tutorials & Examples

Find an implementation by goal and stack. Open the example for its prerequisites and procedure, or use its available code.

{{ range site.Data.examples }}
{{ $page := site.GetPage .page }}
## {{ .title | default $page.Title }}

{{ .description | default $page.Params.short_description | default $page.Description }}

Goal: {{ .goal }}. Stack: {{ delimit .stack ", " }}.

[Open Example]({{ $page.RelPermalink }}index.md){{ range .resources }} | [{{ .label }}]({{ .url }}){{ end }}
{{ end }}

Choose an example that matches your data, stack, and operating requirements.
