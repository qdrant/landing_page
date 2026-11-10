{{- /* Agent-facing twin of the HTML shortcode: same filter, no markup. */ -}}
{{- $want := slice -}}
{{- range split (.Get 0) "," }}{{ $want = $want | append (trim . " ") }}{{ end -}}
{{- if in $want site.Role.Name }}{{ .Inner }}{{ end -}}
