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
    {{- if or (strings.HasPrefix .Name "_") (not (strings.HasSuffix .Name ".md")) -}}
      {{- continue -}}
    {{- end -}}
    {{- $filePath := printf "%s/%s" $dir .Name -}}
    {{- $content := readFile $filePath -}}
    {{- $files = merge $files (dict (strings.TrimSuffix ".md" .Name) $content) -}}
  {{- end -}}
{{- end -}}

{{- range $order -}}
  {{- $snippet := index $files . -}}
  {{- if $snippet }}
{{ $snippet }}
  {{- end -}}
{{- end -}}

{{- range $name, $content := $files -}}
  {{- if not (in $order $name) }}
{{ $content }}
  {{- end -}}
{{- end -}}