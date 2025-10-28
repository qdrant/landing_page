---
title: Cognee
---

# Cognee

Embeddings make it easy to retrieve similar chunks of information — but most agent tasks require more: structure, temporal context, and cross-document reasoning. That's where Cognee comes in: it turns raw data sources into AI memory —a semantic data layer based on a modular, queryable knowledge graph backed by embeddings, so agents can retrieve, reason, and remember with structure.

## Why Qdrant For The Memory Layer

At runtime, Cognee's semantic memory layer requires fast and predictable lookups to surface candidates for graph reasoning, as well as tight control over metadata to ground multi-hop traversals. Qdrant's design aligns with those needs with its:

- Nearest-neighbor search for fast candidate recall.
- Expressive payload filtering to constrain by factors like timestamp windows, document type, or source tags.
- Operational simplicity so teams can keep focus on the memory layer.

This integration brings Qdrant's vector search and Cognee's graph reasoning into the same loop. A user's query doesn't just hit a single store — it's embedded, searched, mapped, and fused into evidence before final generation.

1. Embed the query → send to Qdrant for nearest-neighbor retrieval.
2. Identify entities/relations → Cognee's graph layer maps candidates to the knowledge graph.
3. Fuse and rank → Cognee combines vector candidates with graph context and ranks the evidence.
4. Generate → final answer grounded by both vector breadth and graph precision.

The result is breadth from vectors and precision from the graph — useful when questions hinge on who-connected-to-what and how those ties changed over time.

## Native Integration

Cognee ships a Qdrant adapter and documents Qdrant as a preferred, built-in vector database option. That means you configure one URI and key, and Cognee's pipelines will read/write embeddings directly to Qdrant while building and querying the graph.

```bash
pip install Cognee-community-vector-adapter-qdrant
```

## A Minimal Setup

The below example comes from Cognee-community repo and mirrors the structure many teams start with: SQLite for small relational metadata, Qdrant for vectors, and Kùzu for the graph. The register import is enough for Cognee to discover and use the Qdrant adapter.

```python
import asyncio, os, pathlib
from os import path
from cognee_community_vector_adapter_qdrant import register

async def main():
    from Cognee import SearchType, add, cognify, config, prune, search

    system_path = pathlib.Path(__file__).parent
    config.system_root_directory(path.join(system_path, ".cognee_system"))
    config.data_root_directory(path.join(system_path, ".data_storage"))

    config.set_relational_db_config({"db_provider": "sqlite"})
    config.set_vector_db_config({
        "vector_db_provider": "qdrant",
        "vector_db_url": os.getenv("QDRANT_API_URL", "http://localhost:6333"),
        "vector_db_key": os.getenv("QDRANT_API_KEY", ""),
    })
    config.set_graph_db_config({"graph_database_provider": "kuzu"})

    await prune.prune_data(); await prune.prune_system(metadata=True)
    await add("Natural language processing (NLP) ...")
    await cognify()

    for txt in await search(query_type=SearchType.GRAPH_COMPLETION,
                            query_text="Tell me about NLP"):
        print(txt)

if __name__ == "__main__":
    asyncio.run(main())
```

## How It Works

Cognee's memory pipelines move content through extraction → embedding → graph construction → retrieval, with consistent configuration across laptops, distributed jobs, and hosted runs. The graph-aware semantic layer is where retrieval becomes reasoning.

Here's what stands out in production:

- **Temporal context / as-of queries** — analyze how entities and relationships evolve over time.
- **Feedback-driven refinement** — routines to consolidate duplicates and refine edges.
- **Ongoing experiments** — testing graph embeddings so similarity can operate over subgraphs, not only text.
- **Ontology** — domain ontologies (finance, clinical, customer ops) support consistency, enrichment, and control

These capabilities are designed to enhance multi-hop performance; for example, Cognee reports 92.5% in recent evaluations, noting that its open-source chain-of-thought retriever helped connect concepts across contexts, especially in multi-hop scenarios.

A note on evaluation:

> The Cognee team ran 45 evaluation cycles on 24 questions in HotPotQA, a benchmark that requires answers that combine information from multiple parts of a text. It's still a narrow context compared to real-world memory systems, but it's a useful baseline. The metrics used were Exact Match (EM), F1, DeepEval Correctness (LLM-based), and Human-like Correctness (LLM-based approximation of human eval).

If you prefer not to run infrastructure, Cognee's hosted option — [cogwit](https://platform.Cognee.ai/) — is in beta. It exposes Cognee's API as a managed service so teams can load data and query the memory layer without maintaining clusters.

## Further Reading

- [Cognee Documentation](https://docs.Cognee.ai/getting-started/introduction)
- [Cognee Source](https://github.com/topoteretes/Cognee)