---
label: EDGE VECTOR SEARCH
title: Run Vector Search Where Your Data Lives
subtitle: Run Vector Search Inside Embedded and Edge AI Systems
description1: Qdrant Edge is an embedded vector search engine that runs inside your application process, with no Docker, no background service, and an install footprint of around 11 MB.
description2: Ship it on robots, kiosks, home assistants, and mobile phones, or anywhere connectivity is limited or intermittent, then sync with a central Qdrant server when you need to.
containedButton:
  text: pip install qdrant-edge-py
  url: https://pypi.org/project/qdrant-edge-py/
outlinedButton:
  text: Read Documentation
  url: /documentation/edge/
notice:
  text: Qdrant Edge is in beta as of August 2026. The API and functionality may change in future releases.
  icon:
    src: /icons/outline/circle-alert-grey.svg
    alt: Alert
codeBar: python
code: |
  from pathlib import Path

  SHARD_DIRECTORY = "./qdrant-edge-directory"

  Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
sitemapExclude: true
---

