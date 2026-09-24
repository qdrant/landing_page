---
title: "Prompts"
# The parent headless bundle cascades `list: never`, which makes this section
# unreachable via site.GetPage and leaves the prompt index empty. `list: local`
# keeps these pages out of site-wide collections while still allowing the
# section's .RegularPages to be ranged over. They are never published as URLs.
build:
  list: local
  render: never
  publishResources: false
cascade:
- build:
    list: local
    render: never
    publishResources: false
---
