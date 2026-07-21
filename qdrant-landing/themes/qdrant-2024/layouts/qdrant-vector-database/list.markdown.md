{{- define "rewriteURL" -}}
{{- if hasPrefix . "/" -}}
{{- replaceRE `^(/[^#?]*)([#?]?.*)$` "https://qdrant.tech${1}index.md${2}" . -}}
{{- else -}}{{ . }}{{- end -}}
{{- end -}}
{{- $hero := .Site.GetPage "/qdrant-vector-database/qdrant-vector-database-hero" -}}
{{- $useCases := .Site.GetPage "/qdrant-vector-database/qdrant-vector-database-use-cases" -}}
{{- $features := .Site.GetPage "/qdrant-vector-database/feature-overview" -}}
{{- $getStartedSmall := .Site.GetPage "/headless/get-started-small-rocket" -}}
{{- $additionalResources := .Site.GetPage "/headless/additional-resources" -}}
{{- $getStarted := .Site.GetPage "/headless/get-started" -}}
{{- with $hero }}
# {{ .Params.title }}

{{ .Params.description }}

[{{ .Params.startFree.text }}]({{ template "rewriteURL" .Params.startFree.url }}) | [{{ .Params.contactUs.text }}]({{ template "rewriteURL" .Params.contactUs.url }})
{{ end -}}
{{- with $useCases -}}
{{ range .Params.items }}
## {{ .title }}

{{ .description }}

[{{ .link.text }}]({{ template "rewriteURL" .link.url }})
{{ end }}
{{- end -}}
{{- with $features }}
## {{ .Params.title }}

{{ .Params.description }}
{{ range .Params.cards }}
### {{ .title }}

{{ .content }}{{ with .contentLink }} [{{ .text }}]({{ template "rewriteURL" .url }}){{ end }}{{ with .contentSecondPart }} {{ . }}{{ end }}

[{{ .link.text }}]({{ template "rewriteURL" .link.url }})
{{ end }}
{{- end -}}
{{- with $getStartedSmall }}
## {{ .Params.title }}
{{ with .Params.description }}
{{ . }}
{{ end }}
[{{ .Params.button.text }}]({{ template "rewriteURL" .Params.button.url }})
{{ end -}}
{{- with $additionalResources }}
## {{ .Params.title }}
{{ range .Params.resourceCards }}
- [{{ .title }}]({{ template "rewriteURL" .link.url }}) — {{ .content }}
{{- end }}
{{ end -}}
{{- with $getStarted }}
## {{ .Params.title }}

{{ .Params.subtitle }}

[{{ .Params.button.text }}]({{ template "rewriteURL" .Params.button.url }})
{{ end -}}
