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

{{- $langNames := dict
  "python"     "Python"
  "rust"       "Rust"
  "go"         "Go"
  "typescript" "TypeScript"
  "java"       "Java"
  "csharp"     "C#"
  "http"       "HTTP"
  "bash"       "Bash"
-}}

{{- $deploymentTypes := slice
  (dict "dir" "_server"     "label" "Qdrant Server")
  (dict "dir" "_edge"       "label" "Qdrant Edge")
  (dict "dir" "_serverless" "label" "Qdrant Serverless")
-}}

{{- $basePath := printf "content/%s" $path -}}

{{- $availableTypes := slice -}}
{{- range $deploymentTypes -}}
  {{- $dt := . -}}
  {{- $hasFiles := false -}}
  {{- range $checkDir := slice (printf "%s/%s" $basePath $dt.dir) (printf "%s/%s/generated/%s" $basePath $dt.dir $block) -}}
    {{- if and (fileExists $checkDir) (not $hasFiles) -}}
      {{- range readDir $checkDir -}}
        {{- if and (strings.HasSuffix .Name ".md") (not (strings.HasPrefix .Name "_")) -}}
          {{- $hasFiles = true -}}
        {{- end -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}
  {{- if $hasFiles -}}
    {{- $availableTypes = $availableTypes | append $dt -}}
  {{- end -}}
{{- end -}}

{{- if eq (len $availableTypes) 0 -}}

  {{- /* No deployment subdirs — fallback to base path with language labels */ -}}
  {{- $files := dict -}}
  {{- range $dir := slice $basePath (printf "%s/generated/%s" $basePath $block) -}}
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
    {{- $content := index $files . -}}
    {{- if $content -}}
      {{- $displayName := index $langNames . | default (. | title) }}

**{{ $displayName }} snippet:**

{{ $content }}
    {{- end -}}
  {{- end -}}

  {{- range $name, $content := $files -}}
    {{- if not (in $order $name) -}}
      {{- $displayName := index $langNames $name | default ($name | title) }}

**{{ $displayName }} snippet:**

{{ $content }}
    {{- end -}}
  {{- end -}}

{{- else -}}

  {{- /* Deployment-type aware: output all types with labels */ -}}
  {{- range $availableTypes -}}
    {{- $dt := . -}}

    {{- $files := dict -}}
    {{- range $dir := slice (printf "%s/%s" $basePath $dt.dir) (printf "%s/%s/generated/%s" $basePath $dt.dir $block) -}}
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
      {{- $lang := . -}}
      {{- $content := index $files $lang -}}
      {{- if $content -}}
        {{- $displayName := index $langNames $lang | default ($lang | title) -}}
        {{- if strings.HasPrefix (strings.TrimSpace $content) "```" }}

**{{ $displayName }} snippet for {{ $dt.label }}:**

{{ $content }}
        {{- else }}

*{{ $content | strings.TrimSpace }}*
        {{- end -}}
      {{- end -}}
    {{- end -}}

    {{- range $name, $content := $files -}}
      {{- if not (in $order $name) -}}
        {{- $displayName := index $langNames $name | default ($name | title) -}}
        {{- if strings.HasPrefix (strings.TrimSpace $content) "```" }}

**{{ $displayName }} snippet for {{ $dt.label }}:**

{{ $content }}
        {{- else }}

*{{ $content | strings.TrimSpace }}*
        {{- end -}}
      {{- end -}}
    {{- end -}}

  {{- end -}}

{{- end -}}
