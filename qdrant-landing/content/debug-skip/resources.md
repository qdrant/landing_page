---
title: Resources
---

<details>
  <summary>Resources</summary>
  {{ range resources.Match "**/*.*" }}
  <p>{{ .RelPermalink }}</p>
  {{ end }}
</details>
