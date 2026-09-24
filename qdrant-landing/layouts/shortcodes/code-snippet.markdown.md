{{- $path := .Get "path" -}}
{{- $order := .Get "order" -}}
{{- $block := .Get "block" -}}

{{- if $order -}}
  {{- $order = split $order " " -}}
{{- else -}}
  {{- $order = slice -}}
  {{- $currentPath := $path -}}
  {{- $currentPathParts := split $currentPath "/" -}}
  {{- $numParts := len $currentPathParts -}}
  {{- range seq $numParts -}}
    {{- $index := sub $numParts . -}}
    {{- $currentPath = delimit (first (add $index 1) $currentPathParts) "/" -}}
    {{- $sectionPage := $.Site.GetPage "section" $currentPath -}}
    {{- if and $sectionPage $sectionPage.Params.snippetsOrder -}}
      {{- $order = $sectionPage.Params.snippetsOrder -}}
      {{- break -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- $basePath := printf "content/%s" $path -}}

{{- /* One variant per deployment type (_server, _edge, ...), or a single
       unlabeled variant for snippets without deployment-type subdirs. */ -}}
{{- $variants := slice -}}
{{- $deployments := partial "snippet-deployments.html" (dict "dir" $basePath "block" $block) -}}
{{- range $deployments -}}
  {{- $variants = $variants | append (dict "label" .label "langs" (partial "snippet-files.html" (dict "dir" .path "block" $block "order" $order))) -}}
{{- end -}}
{{- if not $deployments -}}
  {{- $variants = slice (dict "label" "" "langs" (partial "snippet-files.html" (dict "dir" $basePath "block" $block "order" $order))) -}}
{{- end -}}

{{- /* Markdown output shows only the first language of the first variant; the
       rest live on a dedicated snippet page (see content/documentation/snippets/_content.gotmpl). */ -}}
{{- $more := slice -}}
{{- $shown := false -}}
{{- range $variants -}}
  {{- if .langs -}}
    {{- $rest := .langs -}}
    {{- if not $shown -}}
      {{- $shown = true -}}
      {{- with .label }}
**{{ . }}:**

{{ end -}}
{{ (index .langs 0).content }}
      {{- $rest = after 1 .langs -}}
    {{- end -}}
    {{- if $rest -}}
      {{- /* Languages are gathered from the snippet's own files (the code-fence
             identifier), title-cased for display. */ -}}
      {{- $otherLanguages := slice -}}
      {{- range $rest -}}{{- $otherLanguages = $otherLanguages | append (title .lang) -}}{{- end -}}
      {{- $text := delimit $otherLanguages ", " (cond (eq (len $otherLanguages) 2) " and " ", and ") -}}
      {{- with .label -}}{{- $text = printf "%s for %s" $text . -}}{{- end -}}
      {{- $more = $more | append $text -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- if $more -}}
  {{- $linkPath := replace $path "/documentation/headless/snippets/" "/documentation/snippets/" -}}
  {{- with $block -}}{{- $linkPath = printf "%s%s/" $linkPath . -}}{{- end -}}
  {{- $url := printf "https://qdrant.tech%sindex.md" $linkPath }}
> This snippet is also available in {{ delimit $more "; " "; and in " }}. See the [full snippet]({{ $url }}).
{{ end -}}
