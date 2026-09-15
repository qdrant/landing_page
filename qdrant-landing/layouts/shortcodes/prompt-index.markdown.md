{{- /*
  Markdown variant of the prompt index.

  Titles, pages, and skill pointers only. Prompt bodies never appear here, for
  the same reason the `prompt` shortcode drops them: an index.md is consumed by
  agents, and a prompt is an instruction addressed to an agent.

  Keep in step with prompt-index.html, which emits table markup instead of
  pipes because shortcode output is not re-parsed as markdown.
*/ -}}
{{- $section := site.GetPage "documentation/headless/prompts" -}}
{{- if not $section -}}
  {{- errorf "prompt-index: cannot resolve documentation/headless/prompts (see prompt-index.html for the cause)." -}}
{{- end -}}
| Prompt | Page | Agent skill |
|---|---|---|
{{ range $section.RegularPages.ByTitle -}}
| {{ .Title }} | {{ with .Params.page }}{{ . }}{{ else }}none{{ end }} | {{ with .Params.skill }}https://skills.qdrant.tech/{{ . }}/SKILL.md{{ else }}none{{ end }} |
{{ end -}}
