---
#Delimiter files are used to separate the list of documentation pages into sections.
title: "{{ replace .Name "-" " " | title }}"
type: delimiter
weight: 0 # Change this weight to change order of sections
sitemapExclude: True
_build:
  list: never
  publishResources: false
  render: never
---