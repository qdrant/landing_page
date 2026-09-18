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

{{- $files := dict -}}
{{- range $dir := slice (printf "content/%s" $path) (printf "content/%s/generated/%s" $path $block) -}}
  {{- if not (fileExists $dir) -}}
    {{- continue -}}
  {{- end -}}
  {{- range (readDir $dir) -}}
    {{- if or (strings.HasPrefix .Name "_") (not (strings.HasSuffix .Name ".md")) (eq .Name "index.md") -}}
      {{- continue -}}
    {{- end -}}
    {{- $filePath := printf "%s/%s" $dir .Name -}}
    {{- $content := readFile $filePath -}}
    {{- $files = merge $files (dict (strings.TrimSuffix ".md" .Name) $content) -}}
  {{- end -}}
{{- end -}}

{{- /* Ordered list of languages that actually exist for this snippet. */ -}}
{{- $langs := slice -}}
{{- range $order -}}
  {{- if index $files . -}}{{- $langs = $langs | append . -}}{{- end -}}
{{- end -}}
{{- range $name, $content := $files -}}
  {{- if not (in $order $name) -}}{{- $langs = $langs | append $name -}}{{- end -}}
{{- end -}}

{{- /* Markdown output shows only the first language; the rest live on a
       dedicated snippet page (see content/documentation/snippets/_content.gotmpl). */ -}}
{{- if $langs -}}
  {{- $first := index $langs 0 -}}
{{ index $files $first }}
  {{- if gt (len $langs) 1 -}}
    {{- /* Languages are gathered from the snippet's own files (the code-fence
           identifier), title-cased for display. */ -}}
    {{- $otherLanguages := apply (after 1 $langs) "title" "." -}}
    {{- $linkPath := replace $path "/documentation/headless/snippets/" "/documentation/snippets/" -}}
    {{- with $block -}}{{- $linkPath = printf "%s%s/" $linkPath . -}}{{- end -}}
    {{- $url := printf "%sindex.md" $linkPath }}
> This snippet is also available in {{ delimit $otherLanguages ", " ", and " }}. See the [full snippet]({{ $url }}).
{{ end -}}
{{- end -}}