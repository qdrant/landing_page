> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{- $content := printf "# %s\n\n" .Title -}}
{{- range .RegularPages.ByPublishDate.Reverse -}}
  {{- $content = printf "%s- [%s](%s)\n" $content .Title .RelPermalink -}}
{{- end -}}
{{- $content = replaceRE `\]\((/[^):]*/)([\)#?])` `](https://qdrant.tech${1}index.md${2}` $content -}}
{{ $content -}}
