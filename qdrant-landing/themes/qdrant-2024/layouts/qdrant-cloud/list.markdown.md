{{- define "rewriteURL" -}}
{{- if hasPrefix . "/" -}}
{{- replaceRE `^(/[^#?]*)([#?]?.*)$` "https://qdrant.tech${1}index.md${2}" . -}}
{{- else -}}{{ . }}{{- end -}}
{{- end -}}
{{- $hero := .Site.GetPage "/qdrant-cloud/qdrant-cloud-hero" -}}
{{- $bentoCards := .Site.GetPage "/qdrant-cloud/qdrant-cloud-bento-cards" -}}
{{- $featuresLink := .Site.GetPage "/qdrant-cloud/qdrant-cloud-features-link" -}}
{{- $marketplaces := .Site.GetPage "/headless/marketplaces" -}}
{{- $additionalResources := .Site.GetPage "/headless/additional-resources" -}}
{{- $getStarted := .Site.GetPage "/headless/get-started" -}}
{{- with $hero }}
# {{ .Params.title }}

{{ .Params.description }}

[{{ .Params.startFree.text }}]({{ template "rewriteURL" .Params.startFree.url }}) | [{{ .Params.contactUs.text }}]({{ template "rewriteURL" .Params.contactUs.url }})
{{ with .Params.content }}
{{ . }}
{{ end }}
{{- end -}}
{{- with $bentoCards -}}
{{ range .Params.items }}
## {{ .title }}

{{ .description | plainify }}
{{ with .link }}
[{{ .text }}]({{ template "rewriteURL" .url }})
{{ end }}
{{- end }}
{{- end -}}
{{- with $featuresLink }}
{{ .Params.content }}

[{{ .Params.link.text }}]({{ template "rewriteURL" .Params.link.url }})
{{ end -}}
{{- with $marketplaces }}
## {{ .Params.title }}
{{ range .Params.items }}
- [{{ .title }}]({{ template "rewriteURL" .link.url }})
{{- end }}
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
