> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{- $content := .RenderShortcodes -}}
{{- /* This tutorial's HTML figures have theme and mobile variants. Markdown needs one image per figure. */ -}}
{{- $content = replaceRE `<link rel="stylesheet" href="/documentation/examples/reranking-hybrid-search/figures.css">\s*` "" $content -}}
{{- $content = replaceRE `(?s)<figure class="hybrid-reranking-figure">\s*<picture>\s*<source[^>]*>\s*<img src="([^"]+)" alt="([^"]+)"[^>]*>.*?</figure>` `![${2}](${1})` $content -}}
{{- if not (strings.TrimSpace $content) }}# {{ .Title }}
{{ end -}}
{{- /* Rewrite internal absolute links: ](/path/to/page/) → ](https://qdrant.tech/path/to/page/index.md) */}}
{{- $content = replaceRE `\]\((/[^):]*/)([\)#?])` `](https://qdrant.tech${1}index.md${2}` $content -}}
{{- /* Rewrite internal relative links: ](../page/) or (./page/) → same with index.md */}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)([\)#?])` `](https://qdrant.tech/${1}index.md${2}` $content -}}
{{ $content }}
