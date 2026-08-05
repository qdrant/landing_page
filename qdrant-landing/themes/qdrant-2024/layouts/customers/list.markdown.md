{{- /*
  Customers renders one bundle on the live page: content/customers/clients,
  a directory of clients the page presents as a facet filter (industry,
  product, size, location, use case). A table keeps those facets queryable.

  The generic rollup is wrong here because it walks .Pages, which still holds
  18 retired bundles - the case-study-*, logo-cards-* and testimonial-* files
  the page stopped rendering - and republished them as duplicates.
*/ -}}
> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{ $content := printf "# %s\n\n" .Title -}}
{{- with .Description }}{{ $content = printf "%s%s\n\n" $content . }}{{ end -}}
{{- with .Site.GetPage "/customers/customers-hero" -}}
  {{- with strings.TrimSpace (partial "md-params.txt" (dict "v" .Params "level" 2)) -}}
    {{- $content = printf "%s%s\n\n" $content . -}}
  {{- end -}}
{{- end -}}

{{- with .Site.GetPage "/customers/clients" -}}
  {{- $content = printf "%s## Case Studies\n\n" $content -}}
  {{- $content = printf "%s| Company | Industry | Product | Company size | Location | Use cases | Case study |\n| --- | --- | --- | --- | --- | --- | --- |\n" $content -}}
  {{- range .Params.clients -}}
    {{- $study := .title | default "" -}}
    {{- with .blog_path -}}
      {{- /* Trailing slash so md-finish rewrites it to an index.md link. */ -}}
      {{- $study = printf "[%s](%s/)" $study (strings.TrimSuffix "/" .) -}}
    {{- end -}}
    {{- $row := slice
        (.name | default "")
        (.industry | default "")
        (.product | default "")
        (.company_size | default "")
        (.location | default "")
        (delimit (.use_cases | default slice) ", ")
        $study -}}
    {{- $content = printf "%s| %s |\n" $content (delimit $row " | ") -}}
  {{- end -}}
  {{- $content = printf "%s\n" $content -}}
{{- end -}}
{{ partial "md-finish.txt" $content | safeHTML }}
