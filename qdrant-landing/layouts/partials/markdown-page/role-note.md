{{- /*
  Names the product a documentation page describes, and links its counterpart
  when the page exists in another role.

  The agent-facing counterpart of partials/documentation/role-strip.html. That
  one is HTML, so nothing in index.md said which product a page was for.

  Only documentation pages get it. On a marketing page "This page is for Qdrant
  Server" would read as a claim about the product rather than about the page.

  Returns rather than prints, so callers can test it for emptiness.
*/ -}}
{{- $note := "" -}}
{{- if eq .Section "documentation" -}}
  {{- $self := index site.Params.roleLabels site.Role.Name | default site.Role.Name -}}
  {{- $others := slice -}}
  {{- range .Rotate "role" -}}
    {{- if ne .Site.Role.Name site.Role.Name -}}
      {{- $label := index site.Params.roleLabels .Site.Role.Name | default .Site.Role.Name -}}
      {{- with .OutputFormats.Get "markdown" -}}
        {{- $others = $others | append (printf "%s: %s" $label .Permalink) -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}
  {{- $note = printf "This page is for %s." $self -}}
  {{- with $others -}}
    {{- $note = printf "%s It is also available for %s" $note (delimit . ", and for ") -}}
  {{- end -}}
{{- end -}}
{{- return $note -}}
