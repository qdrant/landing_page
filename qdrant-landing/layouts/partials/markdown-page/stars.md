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
{{ range .Params.stats }}- {{ .label }}: {{ .value }}
{{ end -}}
{{ end }}
{{ with site.GetPage "/stars/stars-list" -}}
## {{ .Title }}

{{ with .Params.subtitle }}{{ . }}
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

{{ range .Params.projects -}}
- **{{ .name }}** by {{ .author }} ({{ replace .type "-" " " }}): {{ .description }}
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
