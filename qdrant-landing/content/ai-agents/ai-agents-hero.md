---
subtitle: SOLUTIONS · AGENTIC AI
title: Give Your Agents Memory That Works
description: Store, retrieve, and reason over context with vector search. Drop Qdrant into your agent's retrieval loop in under 10 minutes.
containedButton:
  text: Quickstart Guide
  url: /documentation/quickstart/
outlinedButton:
  text: View Examples
  url: /blog/qdrant-skills-release/
codeBar: agent_memory.py
code: |
  from qdrant_client import QdrantClient
  from qdrant_client.models import Filter, FieldCondition, MatchValue
  
  # Connect to Qdrant
  client = QdrantClient("localhost", port=6333)
  
  # Agent retrieves relevant context
  results = client.query_points(
      collection_name="agent_memory",
      query=embed(user_message),
      query_filter=Filter(
          must=[
              FieldCondition(
                  key="session_id",
                  match=MatchValue(value=session)
              )
          ]
      ),
      limit=5
  )
  
  # Feed context to LLM
  context = [r.payload["text"] for r in results.points]
logosTitle: Trusted by
logos: 
  - id: 0
    src: /img/ai-agents-logos/lyzr.svg
    alt: Lyzr logo
  - id: 1
    src: /img/ai-agents-logos/dust.svg
    alt: Dust logo
  - id: 2
    src: /img/ai-agents-logos/voiceflow.svg
    alt: Voiceflow logo
  - id: 3
    src: /img/ai-agents-logos/trustgraph.svg
    alt: TrustGraph logo
sitemapExclude: true
---