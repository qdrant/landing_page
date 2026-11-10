> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file for an index of the main pages: https://qdrant.tech/llms.txt

{{ $content := .RenderShortcodes -}}
{{- if .Params.retired -}}
  {{- $content = printf "> %s\n\n%s" (partial "common/retirement-notice.html" .) $content -}}
{{- end -}}
{{- if not (strings.TrimSpace $content) }}# {{ .Title }}
{{ end -}}
{{- /* Rewrite internal absolute links: ](/path/to/page/) → ](https://qdrant.tech/path/to/page/index.md) */}}
{{- $content = replaceRE `\]\((/[^):]*/)([\)#?])` `](https://qdrant.tech${1}index.md${2}` $content -}}
{{- /* Rewrite internal relative links: ](../page/) or (./page/) → same with index.md */}}
{{- $content = replaceRE `\]\((\.\.?/[^):]*/)([\)#?])` `](https://qdrant.tech/${1}index.md${2}` $content -}}
{{- /* Both rewrites above hardcode the site root. Outside the default role the
     /documentation/ paths live under the role prefix; everything else stays on
     the default site, which is the only role that mounts it. */}}
{{- if not site.Role.IsDefault -}}
  {{- $roleBase := strings.TrimSuffix "/" site.Home.Permalink -}}
  {{- $content = replace $content "](https://qdrant.tech/documentation/" (printf "](%s/documentation/" $roleBase) -}}
{{- end -}}
{{ $content }}{{ with partial "common/blog-author-profile.html" . }}
## About the Author

{{ .name }}{{ with .role }} | {{ . }}{{ end }}

{{ .bio }}

{{ with .linkedin }}[LinkedIn]({{ . }}){{ end }}{{ if and .linkedin .x }} | {{ end }}{{ with .x }}[X]({{ . }}){{ end }}
{{ end -}}