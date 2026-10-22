> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{ if .IsSection -}}
{{/* The pricing page is assembled from the headless pages under content/pricing/, as in themes/qdrant-2024/layouts/pricing/list.html. */}}
{{- with site.GetPage "/pricing/qdrant-pricing-hero" -}}
# {{ .Title }}

{{ .Description }}

{{ end -}}
{{- with site.GetPage "/pricing/qdrant-pricing-doors-b" -}}
{{- range .Params.tabs }}
## {{ .label }}
{{ range $tier := .tiers }}
### {{ .title }}
{{ with .pricing }}
{{ . }}{{ with $tier.pricingNote }} {{ . }}{{ end }}
{{ end }}
{{ .target }}
{{ range .features }}
- {{ . }}
{{- end -}}
{{- range .featureGroups }}
**{{ .label }}**
{{ range .items }}
- {{ . }}
{{- end }}
{{ end }}

{{ with .cta }}[{{ .text }}]({{ .url | absURL }})
{{ end -}}
{{- end -}}
{{- end }}
{{ end -}}
{{- with site.GetPage "/pricing/qdrant-pricing-calculator" }}
{{ .Title }} {{ .Params.linkPrefix }} [{{ .Params.link.text }}]({{ .Params.link.url }}).
{{ end -}}
{{- with site.GetPage "/pricing/qdrant-pricing-features" }}
## {{ .Title }}
{{ range .Params.tables }}
{{ partial "markdown-page/pricing-table.md" . }}
{{- end }}
[{{ .Params.compareButton.text }}](https://qdrant.tech{{ .Params.compareButton.url }}index.md)
{{ end -}}
{{- with site.GetPage "/pricing/qdrant-pricing-support-reliability" }}
## {{ .Title }}

{{ partial "markdown-page/pricing-table.md" .Params }}
{{- end -}}
{{- with site.GetPage "/pricing/qdrant-pricing-faq" }}
## {{ .Title }}
{{ range .Params.questions }}
### {{ .question }}

{{ .answer }}
{{ end -}}
{{- end -}}
{{- else -}}
# {{ .Title }}

{{ .Description }}

{{ partial "markdown-page/pricing-table.md" .Params }}
{{- end -}}
