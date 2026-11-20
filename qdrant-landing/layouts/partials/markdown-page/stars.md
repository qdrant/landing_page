> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://search.qdrant.tech/md/documentation?q=your+query+here
> Use this file for an index of the main pages: https://qdrant.tech/llms.txt

{{ with site.GetPage "/stars/stars-hero" -}}
# Qdrant Stars

{{ .Title }} {{ .Params.description }}

{{ with .Params.button }}- [{{ .text }}]({{ .url }})
{{ end -}}
{{ with .Params.secondaryButton }}- [{{ .text }}]({{ .url }})
{{ end }}
{{ $count := len (site.GetPage "/stars/stars-list").Params.cards -}}
{{ range .Params.stats }}{{ $value := replace (string (.value | default "")) "{count}" (string $count) }}{{ if $value }}- {{ .label }}: {{ $value }}
{{ end }}{{ end -}}
{{ end }}
{{ with site.GetPage "/stars/stars-list" -}}
{{ $count := len .Params.cards -}}
## {{ .Title }}

{{ with .Params.subtitle }}{{ replace . "{count}" (string $count) }}
{{ end }}
{{ range .Params.cards -}}
### {{ .name }}{{ if .distinguished }} (Distinguished Ambassador){{ end }}

{{ .position }}{{ with .location }} ({{ . }}){{ end }}

{{ with .description }}{{ . }}
{{ end }}
{{ end -}}
{{ end -}}
{{ with site.GetPage "/stars/stars-projects" -}}
## {{ .Title }}

{{ .Params.description }}

{{ range $project := .Params.projects -}}
- **{{ with .url }}[{{ $project.name }}]({{ . }}){{ else }}{{ $project.name }}{{ end }}** by {{ .author }} ({{ replace .type "-" " " }}): {{ .description }}
{{ end }}
{{ end -}}
{{ with site.GetPage "/stars/stars-perks" -}}
## {{ .Title }}

{{ range .Params.perks -}}
- **{{ .title }}**: {{ .description }}
{{ end }}
{{ with .Params.banner }}{{ .text }}{{ with .link }} [{{ .text }}]({{ .url }}){{ end }}
{{ end }}
{{ end -}}
{{ with site.GetPage "/stars/stars-how-to-join" -}}
## {{ .Title }}

{{ range $i, $step := .Params.steps -}}
{{ add $i 1 }}. **{{ $step.title }}** ({{ $step.duration }}): {{ $step.description }}
{{ end }}
{{ end -}}
{{ with site.GetPage "/stars/stars-cta" -}}
{{ with .Params.button }}[{{ .text }}]({{ .url }}){{ end }}
{{ end -}}
