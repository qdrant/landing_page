---
label: Deployment
title: Run the Same Engine on Your Servers or on Qdrant Cloud
description: The engine behind Qdrant Cloud is the open source engine you can download. Pick where it runs today, and move your collections later as your needs change.
image:
  src: /img/lp-open-source/same-engine.png
  alt: One open source Qdrant engine runs in Docker, on Kubernetes, or on Qdrant Cloud, with the same client code pointing at any of them
cards:
  - id: 0
    title: Self-host with Docker or Kubernetes.
    description: Run Qdrant with Docker, Docker Compose, or on Kubernetes. Turn on API keys and TLS before production.
    icon:
      src: /icons/outline/container-blue.svg
      alt: ""
  - id: 1
    title: Let Qdrant Cloud run it for you.
    description: The same engine as a managed service on AWS, GCP, or Azure, with a free tier, zero-downtime rolling upgrades on multi-node clusters, and automatic shard rebalancing.
    icon:
      src: /icons/outline/cloud-managed-blue.svg
      alt: ""
  - id: 2
    title: Build locally, then ship to Cloud.
    description: Develop against Qdrant in Docker, then point the same client code at a Qdrant Cloud cluster URL and API key.
    icon:
      src: /icons/outline/code-xml-blue.svg
      alt: ""
callout:
  text: 'My AskAI standardized on Qdrant Cloud for its AI support agents after running hybrid search on separate AWS infrastructure. Scaling is two clicks in the dashboard, and the agents deflect about 75% of support requests.'
  url: https://qdrant.tech/blog/case-study-my-askai/
  label: Read the My AskAI case study
sitemapExclude: true
---
