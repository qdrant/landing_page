{{- /*
  Markdown output variant of the `prompt` shortcode.

  The prompt body is deliberately omitted. An index.md file is consumed by
  agents, and a prompt is written in the imperative first person, so including
  it risks an agent following the prompt instead of answering the question it
  was actually asked. The skill pointer survives, because that is the part with
  genuine value to an agent.

  The title is always emitted, even when there is no skill. The prose around a
  prompt refers to it by name, so a prompt that left no trace here would turn
  that sentence into a reference to nothing, which is the failure this whole
  variant exists to avoid creating.
*/ -}}
{{- $id := .Get 0 -}}
{{- $p := site.GetPage (printf "documentation/headless/prompts/%s" $id) -}}
{{- with $p }}
> Prompt: {{ .Title }}
{{- range .Params.skills }}
> Related agent skill: https://skills.qdrant.tech/{{ . }}/SKILL.md
{{- end }}
{{ end -}}
