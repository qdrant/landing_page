{{- /*
  island (Markdown output variant).

  The HTML variant (themes/.../layouts/shortcodes/island.html) emits the full
  interactive island: the loader picks up the `.island` figure, imports the
  module, and swaps the fallback for the live widget. None of that machinery
  works in the plain-text Markdown output (index.md, consumed by LLMs and the
  docs mirror) — it would just dump the `<figure class="island">…` shell with
  dead data-island-src/css asset URLs.

  So in Markdown output an island degrades to what its fallback already is: a
  regular Markdown image, followed by the shared `title` as an italic caption.
*/ -}}
{{- $fallback := trim (.Inner | default "") "\n " -}}
{{- $title := trim (.Get "title" | default "") " " -}}
{{ $fallback }}
{{- with $title }}

*{{ . }}*
{{ end -}}
