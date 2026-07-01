{{- $content := printf "# %s\n\n" .Title -}}
{{- range .RegularPages.ByPublishDate.Reverse -}}
  {{- $content = printf "%s- [%s](%s)\n" $content .Title .RelPermalink -}}
{{- end -}}
{{- $content = replaceRE `\]\((/[^):]*/)([\)#?])` `](https://qdrant.tech${1}index.md${2}` $content -}}
{{ $content -}}
