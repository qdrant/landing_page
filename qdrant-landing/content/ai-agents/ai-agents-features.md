---
subtitle: DEVELOPER TOOLS
title: Purpose-Built for Agent Builders
description: Tools and patterns that make agent memory a solved problem, not a research project.
button:
  text: Start Building with Skills
  url: https://github.com/qdrant/skills
codeBar: SKILL.md
code: |
  # Agent Memory Skill
  #
  # Give your agent persistent, filtered
  # memory using Qdrant as the retrieval
  # backend.
  
  # Setup
  # pip install qdrant-client
  
  # Collection Schema
  # vectors:
  #   dense: { size: 1536, distance: Cosine }
  #   sparse: { index: { on_disk: true } }
  # payload_index:
  #   - session_id: keyword
  #   - agent_role: keyword
  #   - timestamp: integer
  #   - tool_name: keyword
  
  # Query Pattern
  # Always filter by session_id + agent_role
  # Use hybrid (dense+sparse) for knowledge
  # Use dense-only for conversation history
features:
  - id: 0
    icon:
      src: /icons/outline/text-search-pink.svg
      alt: Text search
    content: <b>Hybrid search</b> combines dense embeddings with BM25 sparse vectors via reciprocal rank fusion
  - id: 1
    icon:
      src: /icons/outline/filter-blue-large.svg
      alt: Filter
    content: <b>Payload filtering</b> scopes retrieval by any metadata field without post-processing
  - id: 2
    icon:
      src: /icons/outline/boxes-purple.svg
      alt: Boxes
    content: <b>Multi-vector support</b> stores ColBERT token-level representations natively
  - id: 3
    icon:
      src: /icons/outline/target-green.svg
      alt: Target
    content: <b>Quantization</b> (scalar, binary, product) cuts memory 4x while preserving accuracy
  - id: 4
    icon:
      src: /icons/outline/git-branch-orange.svg
      alt: Git branch
    content: <b>Real-time upserts</b> let agents write new memories without index rebuild delays
sitemapExclude: true
---
