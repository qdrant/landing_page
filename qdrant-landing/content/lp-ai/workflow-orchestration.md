---
label: Workflow orchestration
title: Add Ingestion and Search Steps to Your Workflows
description: Your AI data pipeline already runs on a scheduler or a workflow builder. Add Qdrant as a step, and the run that generates new embeddings can also upsert and search them.
cards:
  - id: 0
    title: Schedule ingestion in Apache Airflow.
    description: Install the official Qdrant provider and use its QdrantIngestOperator to upload vectors, IDs, and payloads from any DAG.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Query Qdrant from n8n and Make.
    description: Use the official Qdrant node for n8n to manage collections, upsert points, and search for similar vectors, or add the Qdrant app to your Make (make.com) scenarios.
    icon:
      src: /icons/outline/binary-blue.svg
      alt: ""
button:
  text: Start Free
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
