{{ range $i, $step := hugo.Data.embedding_navigation.steps -}}
{{ add $i 1 }}. [{{ .title }}]({{ .url }}): {{ .description }}
{{ end }}
