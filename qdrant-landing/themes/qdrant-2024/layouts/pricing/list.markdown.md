{{- /*
  Pricing is the one page the generic params renderer cannot carry: its value
  lives in per-tier cells (tier × feature) and in tier cards, which collapse to
  bare feature names if flattened into prose.

  Which bundles are live is decided in pricing/list.html, not by what exists in
  content/pricing: doors-a is a retired A/B variant and must stay out, or this
  page reports prices the site no longer shows.
*/ -}}
> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{ $content := printf "# %s\n\n" .Title -}}
{{- with .Description }}{{ $content = printf "%s%s\n\n" $content . }}{{ end -}}
{{- with .Site.GetPage "/pricing/qdrant-pricing-hero" -}}
  {{- with strings.TrimSpace (partial "md-params.txt" (dict "v" .Params "level" 2)) -}}
    {{- $content = printf "%s%s\n\n" $content . -}}
  {{- end -}}
{{- end -}}

{{- /* Tier cards, grouped by deployment tab. */ -}}
{{- with .Site.GetPage "/pricing/qdrant-pricing-doors-b" -}}
  {{- range .Params.tabs -}}
    {{- $content = printf "%s## %s\n\n" $content (.label | default .id) -}}
    {{- range .tiers -}}
      {{- $tier := . -}}
      {{- $content = printf "%s### %s\n\n" $content .title -}}
      {{- with .pricing -}}
        {{- $content = printf "%s**%s**" $content . -}}
        {{- with $tier.pricingNote }}{{ $content = printf "%s %s" $content . }}{{ end -}}
        {{- $content = printf "%s\n\n" $content -}}
      {{- end -}}
      {{- with .target }}{{ $content = printf "%s%s\n\n" $content . }}{{ end -}}
      {{- range .features }}{{ $content = printf "%s- %s\n" $content . }}{{ end -}}
      {{- with .marketplace -}}
        {{- $names := slice -}}
        {{- range .logos -}}{{- $names = $names | append .name -}}{{- end -}}
        {{- $content = printf "%s\n%s %s\n" $content (.label | default "Available on:") (delimit $names ", ") -}}
      {{- end -}}
      {{- with .cta }}{{ $content = printf "%s\n[%s](%s)\n\n" $content .text .url }}{{ end -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- /* Tier comparison tables: feature matrix and support matrix. */ -}}
{{- with .Site.GetPage "/pricing/qdrant-pricing-features" -}}
  {{- $content = printf "%s## %s\n\n" $content .Title -}}
  {{- range .Params.tables -}}
    {{- with .label }}{{ $content = printf "%s### %s\n\n" $content . }}{{ end -}}
    {{- $content = printf "%s%s\n" $content (partial "md-tier-table.txt" (dict "tiers" .tiers "sections" .sections)) -}}
  {{- end -}}
{{- end -}}
{{- with .Site.GetPage "/pricing/qdrant-pricing-support-reliability" -}}
  {{- $content = printf "%s## %s\n\n" $content .Title -}}
  {{- $content = printf "%s%s\n" $content (partial "md-tier-table.txt" (dict "tiers" .Params.tiers "sections" .Params.sections "first" "Support")) -}}
  {{- with .Params.button }}{{ $content = printf "%s[%s](%s)\n\n" $content .text .url }}{{ end -}}
{{- end -}}

{{- /* Calculator, FAQ and closing CTA, generically. */ -}}
{{- range (slice "qdrant-pricing-calculator" "qdrant-pricing-faq" "qdrant-pricing-cta") -}}
  {{- with $.Site.GetPage (printf "/pricing/%s" .) -}}
    {{- with strings.TrimSpace (partial "md-params.txt" (dict "v" .Params "level" 2)) -}}
      {{- if not (findRE `^#+ [^\n]*$` .) -}}{{- $content = printf "%s%s\n\n" $content . -}}{{- end -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
{{ partial "md-finish.txt" $content | safeHTML }}
