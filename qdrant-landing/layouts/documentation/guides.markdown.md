{{- $content := printf "# %s\n\n%s\n" .Title .Description -}}
{{- $sections := where (site.GetPage "/documentation").Sections.ByWeight "Params.learning_kind" "guides" -}}
{{- if .IsSection -}}
  {{- $sections = slice . -}}
{{- end -}}
{{- range $sections -}}
  {{- if not $.IsSection -}}
    {{- $content = printf "%s\n## [%s](%sindex.md)\n\n%s\n" $content .Title .Permalink .Description -}}
  {{- end -}}
  {{- $content = printf "%s\n" $content -}}
  {{- range .RegularPages.ByWeight -}}
    {{- $content = printf "%s- [%s](%sindex.md)" $content .Title .Permalink -}}
    {{- with .Params.short_description -}}
      {{- $content = printf "%s — %s" $content . -}}
    {{- end -}}
    {{- $content = printf "%s\n" $content -}}
  {{- end -}}
{{- end -}}
{{- range slice (dict "title" "Apply These Techniques" "pages" .Params.worked_examples) (dict "title" "Read More" "pages" .Params.related) -}}
  {{- if .pages -}}
    {{- $content = printf "%s\n## %s\n\n" $content .title -}}
    {{- range .pages -}}
      {{- with site.GetPage . -}}
        {{- $content = printf "%s- [%s](%sindex.md)\n" $content .Title .Permalink -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{ $content -}}
