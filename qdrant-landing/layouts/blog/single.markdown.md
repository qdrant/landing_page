> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{ $content := .RenderShortcodes -}}
{{- /* Blog posts keep the title in front matter: add it when the body has no H1, and put the byline right after the H1. */ -}}
{{- $byline := printf "By %s, %s" .Params.author (.Date.Format "January 2, 2006") -}}
{{- if strings.HasPrefix (strings.TrimSpace $content) "# " -}}
  {{- $content = replaceRE `^\s*(# [^\n]*)\n` (printf "${1}\n\n%s\n" $byline) $content 1 -}}
{{- else -}}
  {{- $content = printf "# %s\n\n%s\n\n%s" .Title $byline (strings.TrimLeft "\n" $content) -}}
{{- end -}}
{{- /* Same link rewriting as layouts/_default/single.markdown.md */ -}}
{{- $content = replaceRE `\]\((/[^):]*/)([\)#?])` `](https://qdrant.tech${1}index.md${2}` $content -}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)([\)#?])` `](https://qdrant.tech/${1}index.md${2}` $content -}}
{{ $content }}