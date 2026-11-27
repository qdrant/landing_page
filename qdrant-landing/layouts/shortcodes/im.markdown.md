{{- /*
  im (Markdown output): the blocks of an immersive page as plain Markdown. The
  hero becomes the title and lead, a section a heading, a cell a heading with
  its figure in bold. The structural closers print nothing. See the HTML variant
  for the kinds.
*/ -}}
{{- $kind := .Get "kind" -}}
{{- if eq $kind "hero" -}}
# {{ .Page.Title }}

{{ with .Get "lead" }}{{ . }}

{{ end -}}
{{- range slice "primary" "secondary" }}{{ with $.Get . }}{{ $p := split . "|" }}- [{{ index $p 0 }}]({{ index $p 1 }})
{{ end }}{{ end }}
{{ with .Get "note" }}{{ . }}

{{ end -}}
{{- else if eq $kind "card" -}}
**{{ .Get "title" }}**
{{ with .Get "meaning" }}
- Meaning: {{ . }}{{ end }}{{ with .Get "location" }}
- Location: {{ . }}{{ end }}

{{ else if eq $kind "section" -}}
{{ with .Get "title" }}## {{ with $.Get "eyebrow" }}{{ if hasPrefix . "Step" }}{{ . }}: {{ end }}{{ end }}{{ . }}

{{ end -}}
{{ with .Get "intro" }}{{ . }}

{{ end -}}
{{- with .Get "more" }}{{ $p := split . "|" }}[{{ index $p 0 }}]({{ index $p 1 }})

{{ end -}}
{{- else if eq $kind "end-section" -}}
{{ with .Get "note" }}{{ . }}

{{ end -}}
{{- else if eq $kind "cell" -}}
{{ with .Get "title" }}### {{ . }}

{{ end -}}
{{ with .Get "fig" }}**{{ . | plainify }}**

{{ end -}}
{{- end -}}
