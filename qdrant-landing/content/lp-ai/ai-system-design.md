---
label: AI system design
title: Better Retrieval Gives Your AI App Better Answers
description: Answer quality starts with retrieval. When the AI data layer returns the right context, the LLM has what it needs to answer well. Good AI system design treats retrieval as a first-class part of the architecture.
image:
  src: /img/lp-ai/workflow-step.png
  alt: 'Retrieval runs as one step in an AI workflow: the retrieve step sends a filtered query to Qdrant and hands the right context to the LLM step'
cards:
  - id: 0
    title: Plug retrieval into AI workflow orchestration.
    description: Qdrant integrates with CrewAI, LlamaIndex, Haystack, LangChain, and AutoGen, so you can run retrieval as a step inside your agent loops and orchestrated workflows.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Design your payload schema with your application.
    description: Store metadata next to each vector and filter on it at query time. Consistent payload fields keep filtering and ranking stable as retrieval requirements change.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Combine retrieval primitives at query time.
    description: Mix dense vectors, sparse vectors, metadata filters, and multi-vector representations in one query, with explicit control over the relevance, latency, and cost of each.
    icon:
      src: /icons/outline/binary-blue.svg
      alt: ""
callout:
  text: OpenTable built Concierge, an assistant that answers restaurant questions in natural language, on Qdrant Cloud. Each query filters reviews, metadata, and other structured restaurant data at once, and the launch was global from day one, served from one deployment.
  url: https://qdrant.tech/blog/case-study-opentable/
  label: Read the OpenTable case study
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
