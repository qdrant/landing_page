{{ range hugo.Data.embedding_navigation.featured }}
### {{ .title }} ({{ .tag }})

{{ .description }}

[{{ .link.text }}]({{ .link.url }})
{{ end }}
