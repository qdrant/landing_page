{{- /* A pricing tier table: `tiers` are the columns, `sections` group the feature rows. */ -}}
{{- $t := "| Feature |" -}}
{{- $sep := "|---|" -}}
{{- range .tiers }}{{ $t = printf "%s %s |" $t .name }}{{ $sep = printf "%s---|" $sep }}{{ end -}}
{{- $t = printf "%s\n%s\n" $t $sep -}}
{{- range .sections -}}
  {{- $t = printf "%s| **%s** |%s\n" $t .name (strings.Repeat (len $.tiers) " |") -}}
  {{- range $f := .features -}}
    {{- $t = printf "%s| %s |" $t $f.name -}}
    {{- range $.tiers -}}
      {{- $v := index $f .id -}}
      {{- if eq $v true }}{{ $v = "Yes" }}{{ else if eq $v false }}{{ $v = "No" }}{{ end -}}
      {{- $t = printf "%s %v |" $t $v -}}
    {{- end -}}
    {{- $t = printf "%s\n" $t -}}
  {{- end -}}
{{- end -}}
{{- return $t -}}
