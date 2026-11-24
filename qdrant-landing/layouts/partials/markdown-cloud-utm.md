{{- /* Agents get no JS, so addUTMToLinks never tags their Cloud links. Matching the bare host leaves cluster URLs (*.cloud.qdrant.io) alone. */ -}}
{{- $q := printf "utm_source=agent&utm_content=%s" (urlquery (strings.Trim .page.RelPermalink "/" | default "home")) -}}
{{- return replaceRE `https://cloud\.qdrant\.io(/signup|/login|/calculator|/)?([)\s"'>\],.]|$)` (printf "https://cloud.qdrant.io${1}?%s${2}" $q) .content -}}
