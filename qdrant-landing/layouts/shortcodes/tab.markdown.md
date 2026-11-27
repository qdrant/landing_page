{{- /* Markdown output for one tab: its label in bold, then its content. */ -}}
**{{ .Get "label" }}:**

{{ trim .Inner "\n" }}
