---
subtitle: BUILDER PATTERNS
title: What Developers Build with Qdrant
description: Common agent architectures and the retrieval patterns behind them.
features:
  - id: 0
    title: Retrieval-Augmented Generation
    description: Your agent queries Qdrant for semantically relevant documents, passes them as context to the LLM, and generates grounded answers instead of hallucinating. Use hybrid search (dense + sparse vectors) to catch both semantic meaning and exact terms. Add payload filters to scope retrieval by source, date, or access level.
    codeBar: rag_agent.py
    code: |
      # Hybrid search: dense + sparse
      results = client.query_points(
          collection_name="knowledge_base",
          prefetch=[
              Prefetch(query=dense_vec, using="dense", limit=20),
              Prefetch(query=sparse_vec, using="sparse", limit=20),
          ],
          query=FusionQuery(
              fusion=Fusion.RRF
          ),
          limit=5
      )
    cardTitle: 75%
    cardContent: <b>Dust</b> reduced RAM usage by 75% after migrating from in-memory retrieval to Qdrant for production RAG.
  - id: 1
    title: Real-Time Voice Agents
    description: Voice agents can't tolerate latency. Every millisecond in the retrieval loop compounds into awkward pauses. Qdrant's Rust-based engine delivers sub-25ms P99 retrieval so your conversational agent stays responsive.<br><br>Filter by session and speaker to retrieve only the current conversation's context without cross-talk between concurrent calls.
    codeBar: voice_agent.py
    code: |
      # Low-latency session-scoped retrieval
      context = client.query_points(
          collection_name="call_memory",
          query=embed(transcript_chunk),
          query_filter=Filter(
              must=[
                  FieldCondition(
                      key="call_id",
                      match=MatchValue(
                          value=active_call
                      )
                  )
              ]
          ),
          limit=3
      )
    cardTitle: 25ms
    cardContent: <b>Tavus</b> achieved 25ms retrieval for conversational AI without awkward pauses.
  - id: 2
    title: Customer Support Agents
    description: Index your knowledge base, past tickets, and product docs. The support agent retrieves the most relevant resolution on the first pass, avoiding the loop-and-retry pattern that frustrates users. Use Qdrant's multi-tenancy (payload-based partitioning) to isolate each customer's data without deploying separate collections.
    codeBar: support_agent.py
    code: |
      # Tenant-isolated knowledge retrieval 
      answer = client.query_points(
          collection_name="support_kb",
          query=embed(ticket_text),
          query_filter=Filter(
              must=[
                  FieldCondition(
                      key="tenant_id",
                      match=MatchValue(
                          value=org_id
                      )
                  )
              ]
          ),
          limit=5
      )
    cardTitle: 90%
    cardContent: <b>Lyzr</b> reduced latency by 90% serving support agents on Qdrant.
  - id: 3
    title: Recommendation Agents
    description: Embed user behavior, product attributes, and content metadata into Qdrant. Your recommendation agent queries with the user's current context and gets semantically relevant suggestions, not just collaborative filtering. Combine dense embeddings with sparse keyword vectors for hybrid recommendations that understand both "similar style" and "exact feature match."
    codeBar: rec_agent.py
    code: |
      # Discovery: find items unlike dislikes
      recs = client.discover(
          collection_name="products",
          target=user_preference_vec,
          context=[
              ContextPair(
                  positive=liked_item_id,
                  negative=disliked_item_id,
              )
          ],
          limit=10
      )
    cardTitle: 1B+
    cardContent: <b>Tripadvisor</b> searches across billions of user-generated content pieces with Qdrant.
  - id: 4
    title: Multi-Agent Shared Memory
    description: Multiple agents (planner, researcher, executor) write to and read from a shared Qdrant collection. Each agent tags its outputs with role and step metadata, so downstream agents retrieve only the context they need.<br><br>Use payload filters to scope reads by agent role, workflow step, or timestamp to prevent context pollution across agents.
    codeBar: multi_agent.py
    code: |
      # Executor reads planner's output
      plan = client.query_points(
          collection_name="workflow_memory",
          query=embed(current_task),
          query_filter=Filter(
              must=[
                  FieldCondition(
                      key="agent_role",
                      match=MatchValue(
                          value="planner"
                      )
                  ),
                  FieldCondition(
                      key="workflow_id",
                      match=MatchValue(
                          value=wf_id
                      )
                  )
              ]
          ),
          limit=10
      )
    cardTitle: 4x
    cardContent: <b>Voiceflow</b> runs managed RAG on Qdrant, powering multi-step conversational workflows at scale.
sitemapExclude: true
---
