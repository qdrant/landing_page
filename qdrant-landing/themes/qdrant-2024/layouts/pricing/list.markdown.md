{{- /*
  Pricing is the one page the generic params renderer cannot carry: its value
  lives in per-tier cells (tier × feature), which only survive as tables.
  Everything else on the page still goes through the generic renderer.
*/ -}}
> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{ $content := printf "# %s\n\n" .Title -}}
{{- with .Description }}{{ $content = printf "%s%s\n\n" $content . }}{{ end -}}

{{- /* Tier cards: price and per-tier feature lists. */ -}}
{{- range (sort .Pages "File.Path") -}}
  {{- if in .File.BaseFileName "doors" -}}
    {{- $note := .Params.pricingNote -}}
    {{- range .Params.cards -}}
      {{- $content = printf "%s## %s\n\n" $content .title -}}
      {{- with .price -}}
        {{- $content = printf "%s**%s**" $content . -}}
        {{- with $note }}{{ $content = printf "%s %s" $content . }}{{ end -}}
        {{- $content = printf "%s\n\n" $content -}}
      {{- end -}}
      {{- with .description }}{{ $content = printf "%s%s\n\n" $content . }}{{ end -}}
      {{- with .featureDescription }}{{ $content = printf "%s%s\n\n" $content . }}{{ end -}}
      {{- range .features -}}
        {{- with .content }}{{ $content = printf "%s- %s\n" $content . }}{{ end -}}
      {{- end -}}
      {{- with .button }}{{ $content = printf "%s\n[%s](%s)\n\n" $content .text .url }}{{ end -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- /* Feature comparison: one Markdown table per tier group. */ -}}
{{- with .Site.GetPage "/pricing/qdrant-pricing-features" -}}
  {{- $content = printf "%s## %s\n\n" $content .Title -}}
  {{- range .Params.tables -}}
    {{- $tiers := .tiers -}}
    {{- with .label }}{{ $content = printf "%s### %s\n\n" $content . }}{{ end -}}
    {{- $head := slice "Feature" -}}
    {{- range $tiers -}}{{- $head = $head | append .name -}}{{- end -}}
    {{- $content = printf "%s| %s |\n|%s\n" $content (delimit $head " | ") (strings.Repeat (len $head) " --- |") -}}
    {{- range .sections -}}
      {{- with .name }}{{ $content = printf "%s| **%s** |%s\n" $content . (strings.Repeat (len $tiers) " |") }}{{ end -}}
      {{- range .features -}}
        {{- $row := slice .name -}}
        {{- $f := . -}}
        {{- range $tiers -}}
          {{- $cell := index $f .id -}}
          {{- if eq $cell true -}}{{- $row = $row | append "Yes" -}}
          {{- else if or (eq $cell false) (eq $cell nil) -}}{{- $row = $row | append "—" -}}
          {{- else -}}{{- $row = $row | append (printf "%v" $cell) -}}{{- end -}}
        {{- end -}}
        {{- $content = printf "%s| %s |\n" $content (delimit $row " | ") -}}
      {{- end -}}
    {{- end -}}
    {{- $content = printf "%s\n" $content -}}
  {{- end -}}
{{- end -}}

{{- /* Everything else on the page, generically. */ -}}
{{- range (sort .Pages "File.Path") -}}
  {{- if not (or (in .File.BaseFileName "doors") (in .File.BaseFileName "features")) -}}
    {{- with strings.TrimSpace (partial "md-params.txt" (dict "v" .Params "level" 2)) -}}
      {{- if not (findRE `^#+ [^\n]*$` .) -}}{{- $content = printf "%s%s\n\n" $content . -}}{{- end -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
{{ partial "md-finish.txt" $content | safeHTML }}
