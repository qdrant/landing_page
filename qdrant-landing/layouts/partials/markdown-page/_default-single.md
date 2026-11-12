> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file for an index of the main pages: https://qdrant.tech/llms.txt
{{ $content := partial "common/products/markdown-sections.html" .RenderShortcodes -}}
{{ if strings.Contains $content `<product-specific products="` }}> Content inside `<product-specific products="...">` tags applies only to the named products. All other content applies to every Qdrant product. If you know which product the user is on, ignore tagged content for other products.{{ "\n" }}{{ end }}{{ "\n" }}
{{- with .Params.products -}}
  {{- $r := partial "common/products/resolve.html" (dict "products" . "where" (printf "%s: front matter" $.File.Path)) -}}
  {{- $content = printf "> This page is only for %s.\n\n%s" $r.text $content -}}
{{- end -}}
{{- if .Params.retired -}}
  {{- $content = printf "> %s\n\n%s" (partial "common/retirement-notice.html" .) $content -}}
{{- end -}}
{{- if not (strings.TrimSpace $content) }}# {{ .Title }}
{{ end -}}
{{- /* Rewrite internal absolute links: ](/path/to/page/) → ](https://qdrant.tech/path/to/page/index.md) */}}
{{- $content = replaceRE `\]\((/[^):]*/)([\)#?])` `](https://qdrant.tech${1}index.md${2}` $content -}}
{{- /* Rewrite internal relative links: ](../page/) or (./page/) → same with index.md */}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)([\)#?])` `](https://qdrant.tech/${1}index.md${2}` $content -}}
{{ $content }}{{ with partial "common/blog-author-profile.html" . }}
## About the Author

{{ .name }}{{ with .role }} | {{ . }}{{ end }}

{{ .bio }}

{{ with .linkedin }}[LinkedIn]({{ . }}){{ end }}{{ if and .linkedin .x }} | {{ end }}{{ with .x }}[X]({{ . }}){{ end }}
{{ end -}}