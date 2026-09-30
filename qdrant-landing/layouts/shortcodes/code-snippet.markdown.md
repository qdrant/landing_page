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

{{- /* Markdown output shows only the first language of the first variant that
       has one; the rest live on a dedicated snippet page (see
       content/documentation/snippets/_content.gotmpl). Languages whose file
       holds a plain-text message instead of a snippet are left out, and a
       deployment type without a single snippet is called out separately. */ -}}
{{- $more := slice -}}
{{- $unsupported := slice -}}
{{- $shown := false -}}
{{- range $variants -}}
  {{- $langs := where .langs "supported" true -}}
  {{- if not $langs -}}
    {{- with .label -}}{{- $unsupported = $unsupported | append . -}}{{- end -}}
  {{- else -}}
    {{- $rest := $langs -}}
    {{- if not $shown -}}
      {{- $shown = true -}}
      {{- with .label }}
**{{ . }}:**

{{ end -}}
{{ (index $langs 0).content }}
      {{- $rest = after 1 $langs -}}
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

{{- $notes := slice -}}
{{- if $more -}}
  {{- $linkPath := replace $path "/documentation/headless/snippets/" "/documentation/snippets/" -}}
  {{- with $block -}}{{- $linkPath = printf "%s%s/" $linkPath . -}}{{- end -}}
  {{- $url := printf "https://qdrant.tech%sindex.md" $linkPath -}}
  {{- $notes = $notes | append (printf "This snippet is also available in %s. See the [full snippet](%s)." (delimit $more "; " "; and in ") $url) -}}
{{- end -}}
{{- if $unsupported -}}
  {{- $notes = $notes | append (printf "Not supported on %s." (delimit $unsupported ", " (cond (eq (len $unsupported) 2) " and " ", and "))) -}}
{{- end -}}
{{- with $notes }}
> {{ delimit . " " }}
{{ end -}}
