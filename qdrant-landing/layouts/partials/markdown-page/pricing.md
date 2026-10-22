> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{ if .IsSection -}}
{{- /* Sections and their order come from `sections` in content/pricing/_index.md, as for the HTML page. */ -}}
{{- range $name := .Params.sections -}}
{{- with site.GetPage (printf "/pricing/%s" $name) -}}
{{- if eq $name "qdrant-pricing-hero" -}}
# {{ .Title }}

{{ .Description }}

{{ else if eq $name "qdrant-pricing-doors-b" -}}
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
{{ else if eq $name "qdrant-pricing-calculator" }}
{{ .Title }} {{ .Params.linkPrefix }} [{{ .Params.link.text }}]({{ .Params.link.url }}).
{{ else if eq $name "qdrant-pricing-features" }}
## {{ .Title }}
{{ range .Params.tables }}
{{ partial "markdown-page/pricing-table.md" . }}
{{- end }}
[{{ .Params.compareButton.text }}](https://qdrant.tech{{ .Params.compareButton.url }}index.md)
{{ else if eq $name "qdrant-pricing-support-reliability" }}
## {{ .Title }}

{{ partial "markdown-page/pricing-table.md" .Params }}
{{- else if eq $name "qdrant-pricing-faq" }}
## {{ .Title }}
{{ range .Params.questions }}
### {{ .question }}

{{ .answer }}
{{ end -}}
{{- else if eq $name "qdrant-pricing-cta" -}}
{{- /* A sign-up banner, nothing for agents to read. */ -}}
{{- else -}}
{{- errorf "pricing section %q has no Markdown renderer in layouts/partials/markdown-page/pricing.md" $name -}}
{{- end -}}
{{- else -}}
{{- errorf "pricing section %q has no page content/pricing/%s.md" $name $name -}}
{{- end -}}
{{- end -}}
{{- else -}}
# {{ .Title }}

{{ .Description }}

{{ partial "markdown-page/pricing-table.md" .Params }}
{{- end -}}
