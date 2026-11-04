---
label: Multi-agent systems
title: One Memory Layer for Multi-Agent Systems
description: In multi-agent systems, AI agents run in parallel and in series, and each one sends its own retrieval requests. In autonomous AI systems, a single workflow can run thousands of retrieval steps, so latency compounds and one slow result slows the whole chain.
cards:
  - id: 0
    title: Built for parallel retrieval.
    description: Qdrant is written in Rust. At Lyzr, latency stays steady with 100+ concurrent agents sending over 1,000 queries per minute.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Give each agent only the access it needs.
    description: Role-based access control (RBAC), SSO, and API keys scoped to individual collections keep agents inside their own data.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
callout:
  text: Deutsche Telekom built LMOS, a multi-agent platform, on Qdrant. It serves three countries and 2M+ conversations, and cut agent development time from 15 days to 2 days.
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
