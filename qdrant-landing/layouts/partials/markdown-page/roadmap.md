> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file for an index of the main pages: https://qdrant.tech/llms.txt

{{ $products := slice -}}
{{ range partial "marketing/product-updates/products" . }}{{ if where $.Params.items "product" .key }}{{ $products = $products | append . }}{{ end }}{{ end -}}
# {{ .Title }}

{{ .Params.hero.description }}

Items are tagged with the product they belong to: {{ range $i, $p := $products }}{{ if $i }}, {{ end }}{{ $p.name }} ({{ $p.detail }}){{ end }}.
{{ range slice (dict "key" "in-progress" "title" "In Progress") (dict "key" "planned" "title" "Planned") }}
## {{ .title }}
{{ range where $.Params.items "status" .key }}
### {{ .title }}

{{ (index (where $products "key" .product) 0).name }}{{ with .area }}, {{ . }}{{ end }}

{{ .description }}{{ with .link }} [{{ if strings.Contains . "github.com" }}Track on GitHub{{ else }}Learn more{{ end }}]({{ if strings.HasPrefix . "/" }}https://qdrant.tech{{ . }}index.md{{ else }}{{ . }}{{ end }}){{ end }}
{{ end -}}
{{ end }}
Released changes are listed in the changelog: https://qdrant.tech/changelog/index.md
