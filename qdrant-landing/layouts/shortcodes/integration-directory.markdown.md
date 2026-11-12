{{- /*
  Markdown variant of the integration directory: the same pages as a table.
  The page list and facets come from partials/integration-directory.html,
  shared with the HTML variant.

  Links are site paths with a trailing slash, which the page's markdown layout
  rewrites to their absolute index.md form, like every other internal link.
  Text cells escape "|" so a summary can't split its row; the partial rejects
  "|" in facet values.
*/ -}}
{{- $data := partialCached "integration-directory.html" . (printf "%s|%v|%v|%v" .Page.Path (.Get "facets") (.Get "noun") (.Get "plural")) -}}
| {{ title $data.noun }} | Summary |{{ range $data.facets }} {{ replace .label "|" "\\|" }} |{{ end }}
|---|---|{{ range $data.facets }}---|{{ end }}
{{ range $data.pages -}}
{{- $directory := .Params.directory -}}
| [{{ replace .Title "|" "\\|" }}]({{ .RelPermalink }}) | {{ replace $directory.summary "|" "\\|" }} |{{ range $data.facets }} {{ delimit (index $directory .key) ", " }} |{{ end }}
{{ end -}}
