{{- $content := "# Tutorials & Examples\n\nFind an implementation by goal and stack. Open the example for its prerequisites and procedure, or use its available code.\n" -}}
{{- range partialCached "documentation/examples/pages.html" . -}}
  {{- $page := . -}}
  {{- $content = printf "%s\n## %s\n\n%s\n\nGoal: %s. Stack: %s.\n\n[Open Example](%sindex.md)" $content $page.Title ($page.Params.short_description | default $page.Description) .Params.goal (delimit .Params.stack ", ") $page.Permalink -}}
  {{- range .Params.example_resources -}}
    {{- $content = printf "%s | [%s](%s)" $content .label .url -}}
  {{- end -}}
  {{- $content = printf "%s\n" $content -}}
{{- end -}}
{{- $content = printf "%s\nChoose an example that matches your data, stack, and operating requirements.\n" $content -}}
> Explore Qdrant's agent skills catalog at https://skills.qdrant.tech/
> Search the documentation at https://skills.qdrant.tech/search?query=your+query+here
> Use this file to discover all available pages: https://qdrant.tech/llms.txt

{{ $content -}}
