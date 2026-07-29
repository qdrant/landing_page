> Fetch the complete index at: https://qdrant.tech/llms.txt
> Use this file to discover all available pages before exploring further.

{{- $content := printf "# %s\n\n" .Title -}}
{{- range .RegularPages.ByPublishDate.Reverse -}}
  {{- $content = printf "%s- [%s](%s)\n" $content .Title .RelPermalink -}}
{{- end -}}
{{- $content = replaceRE `\]\((/[^):]*/)([\)#?])` `](https://qdrant.tech${1}index.md${2}` $content -}}
{{ $content -}}
