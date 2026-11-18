> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file for an index of the main pages: https://qdrant.tech/llms.txt

{{ $products := slice -}}
{{ range partial "marketing/product-updates/products" . }}{{ if where $.Params.entries "product" .key }}{{ $products = $products | append . }}{{ end }}{{ end -}}
# {{ .Title }}

{{ .Params.hero.description }}

Newest first. Each release names its product: {{ range $i, $p := $products }}{{ if $i }}, {{ end }}{{ $p.name }} ({{ $p.detail }}){{ end }}. The full Qdrant release history is at https://github.com/qdrant/qdrant/releases.
{{ range sort .Params.entries "date" "desc" }}
## {{ (index (where $products "key" .product) 0).name }}{{ with .edition }} ({{ . }}){{ end }} {{ .version }}

Released {{ (time.AsTime .date).Format "2006-01-02" }}.{{ with .summary }} {{ . }}{{ end }}
{{ with .description }}
{{ replaceRE `\]\((/[^)#]*/)(#[^)]*)?\)` `](https://qdrant.tech${1}index.md${2})` . }}
{{ end -}}
{{ range .highlights }}
- {{ replaceRE `\]\((/[^)#]*/)(#[^)]*)?\)` `](https://qdrant.tech${1}index.md${2})` . }}
{{- end }}
{{ with .blog }}
Release post: {{ replaceRE `^(/[^#]*/)(#.*)?$` `https://qdrant.tech${1}index.md${2}` . }}
{{ end -}}
{{ with .url }}
Full release notes: {{ if strings.HasPrefix . "/" }}{{ replaceRE `^(/[^#]*/)(#.*)?$` `https://qdrant.tech${1}index.md${2}` . }}{{ else }}{{ . }}{{ end }}
{{ end -}}
{{ end }}
Planned work is listed on the roadmap: https://qdrant.tech/roadmap/index.md
