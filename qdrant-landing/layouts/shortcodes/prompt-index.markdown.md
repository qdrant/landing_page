{{- /*
  Markdown variant of the prompt index.

  Titles, pages, and skill pointers only. Prompt bodies never appear here, for
  the same reason the `prompt` shortcode drops them: an index.md is consumed by
  agents, and a prompt is an instruction addressed to an agent.

  Keep in step with prompt-index.html, which emits table markup instead of
  pipes because shortcode output is not re-parsed as markdown.

  Page links are absolute and index.md-suffixed to match every other link in
  this output, which single.markdown.md rewrites that way. A bare site path
  would be the one column an agent reading this table could not resolve.
*/ -}}
{{- $section := site.GetPage "documentation/headless/prompts" -}}
{{- if not $section -}}
  {{- errorf "prompt-index: cannot resolve documentation/headless/prompts (see prompt-index.html for the cause)." -}}
{{- end -}}
| Prompt | Page | Agent skills |
|---|---|---|
{{ range $section.RegularPages.ByTitle -}}
| {{ .Title }} | {{ with .Params.page }}{{ with site.GetPage . }}{{ .Permalink }}index.md{{ else }}{{ . }}{{ end }}{{ else }}None{{ end }} | {{ with .Params.skills }}{{ range $i, $s := . }}{{ if $i }}, {{ end }}https://skills.qdrant.tech/{{ $s }}/SKILL.md{{ end }}{{ else }}None{{ end }} |
{{ end -}}
