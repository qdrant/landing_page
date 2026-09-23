{{- /*
  chart, Markdown output — emit the data, not the drawing.

  Pages build in both HTML and Markdown (config.toml [outputs]: page = ["HTML",
  "Markdown"]), and without this file the HTML template serves both. That pasted
  the entire generated SVG into the .md: gridline coordinates, transforms, a
  <style> block. Measured on articles/how-to-tune-hybrid-search, the two figures
  were 26,555 of 39,486 bytes — 67% of a document whose whole audience is LLMs
  and markdown readers — to convey what a short table conveys better.

  Every chart is generated FROM a CSV, and a CSV is already a table, so the
  fallback is the source data rather than prose describing it. That makes the
  markdown strictly richer than the picture: the SVG rounds for display and can
  only show what fits, while the table carries every column, including ones the
  chart never plots.

  Deliberately not an alt-text-style description. A sentence about a chart is a
  lossy summary someone has to keep in sync with the numbers; the numbers keep
  themselves in sync.
*/ -}}
{{- $id := .Get "id" -}}
{{- if not $id }}{{ errorf "chart in %s: 'id' is required." .Position }}{{ end -}}
{{- $caption := .Get "caption" -}}
{{- if not $caption }}{{ errorf "chart in %s: 'caption' is required." .Position }}{{ end -}}
{{- $spec := false -}}
{{- range (index site.Data "viz-charts") -}}{{- if eq .id $id -}}{{- $spec = . -}}{{- end -}}{{- end -}}
{{- if not $spec }}{{ errorf "chart in %s: no chart with id %q in data/viz-charts.json." .Position $id }}{{ end -}}
{{- $csv := resources.Get (printf "viz/%s.csv" $id) -}}
{{- if not $csv }}{{ errorf "chart in %s: assets/viz/%s.csv missing; the Markdown output renders the chart's source table." .Position $id }}{{ end -}}
{{- $rows := $csv | transform.Unmarshal -}}
{{- $head := index $rows 0 -}}
{{- with $spec.title }}**{{ . }}**{{ end }}
{{ with $spec.subtitle }}{{ . }}
{{ end }}
| {{ delimit $head " | " }} |
|{{ range $head }} --- |{{ end }}
{{ range after 1 $rows }}| {{ delimit . " | " }} |
{{ end }}
_{{ $caption }}_
