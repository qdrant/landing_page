---
title: brand-resources
type: marketing/brand-resources
description: brand-resources
build:
  render: always
cascade:
- type: marketing/brand-resources
- build:
    list: local
    publishResources: false
    render: never
---
