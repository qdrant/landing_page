{{- /*
  Markdown output variant of the `prompt` shortcode.

  The prompt body is deliberately omitted. An index.md file is consumed by
  agents, and a prompt is written in the imperative first person, so including
  it risks an agent following the prompt instead of answering the question it
  was actually asked. The skill pointer survives, because that is the part with
  genuine value to an agent.
*/ -}}
{{- $id := .Get 0 -}}
{{- $p := site.GetPage (printf "documentation/headless/prompts/%s" $id) -}}
{{- with $p -}}
  {{- with .Params.skill }}
> Related agent skill: https://skills.qdrant.tech/{{ . }}/SKILL.md
{{ end -}}
{{- end -}}
