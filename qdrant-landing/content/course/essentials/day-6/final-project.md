---
title: "Final Project: Production-Ready Documentation Search Engine"
weight: 1
---

{{< date >}} Day 6 {{< /date >}}

# Final Project: Production-Ready Documentation Search Engine

<div class="video">
<iframe 
  src="https://www.youtube.com/embed/CllIGw1QwLg?si=ruv4y9tk_nQpaDvs"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

<br/>


## Your Mission

It's time to synthesize everything you've learned into a portfolio-ready application. You'll build a sophisticated documentation search engine that shows hybrid retrieval, multivector reranking, and production-quality evaluation.

Your search engine will understand both semantic meaning and exact keywords, then use fine-grained reranking to surface the most relevant documentation sections. When someone searches for "how to configure HNSW parameters," your system should return the exact section with practical examples, not just a page that mentions "HNSW" somewhere.

This mirrors real-world retrieval challenges where users need precise answers from large documentation sets. You'll implement the complete pipeline: ingestion with smart chunking, hybrid search with dense and sparse signals, and multivector reranking for precision.

**Estimated Time:** 210 minutes

## What You'll Build

- A single collection that stores dense, sparse, and ColBERT multivectors
- A hybrid search pipeline (dense + sparse with server-side fusion)
- ColBERT reranking for fine-grained matches
- An evaluation step with Recall@10, MRR, and P50/P95 latency

## Setup

### Prerequisites
* Qdrant Cloud cluster (URL + API key)
* Python 3.9+ (or Google Colab)
* Packages: `qdrant-client`, `numpy`, `python-dotenv`

### Models
- **Dense**: `BAAI/bge-small-en-v1.5` (384-dim) or `BAAI/bge-base-en-v1.5` (768-dim)
- **Sparse**: BM25/TF-IDF or SPLADE
- **Multivector**: `colbert-ir/colbertv2.0` (128-dim tokens)

### Dataset
- **Scope:** A full documentation set (e.g., Qdrant docs or a library you use)
- **Fields:** Chunk by doc structure. Keep: `page_title`, `section_title`, `page_url`, `section_url`, `breadcrumbs`, `chunk_text`, `prev_section_text`, `next_section_text`, `tags`.
- **Filters:** Consider `tags` or `breadcrumbs` for faceting.
- **Payload example:**
```python
payload = {
    "page_title": "Configuration Guide",
    "section_title": "HNSW Parameters",
    "page_url": "/docs/guides/configuration/",
    "section_url": "/docs/guides/configuration/#hnsw-parameters",
    "breadcrumbs": ["Guides", "Configuration", "HNSW Parameters"],
    "chunk_text": "The main section content...",
    "prev_section_text": "Previous section for context...",
    "next_section_text": "Next section for context...",
    "tags": ["configuration", "performance", "hnsw"]
}
```

## Build Steps

### Step 1: Initialize Client

```python
from qdrant_client import QdrantClient, models
import os
from dotenv import load_dotenv

load_dotenv()
client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

# For Colab:
# from google.colab import userdata
# client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))
```

### Step 2: Collection Design

Create `docs_search` with three vectors (dense 384, sparse, ColBERT multivector with `m=0`).
*If you choose a 768-dim dense model, set `size=768` below.*

```python
collection_name = "docs_search"

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
            hnsw_config=models.HnswConfigDiff(m=0)  # Reranking only
        )
    },
    sparse_vectors_config={"sparse": models.SparseVectorParams()}
)
```

### Step 3: Parse and Chunk Documents

Pick a documentation set and parse it into structured sections. Preserve the hierarchy users expect.

**Section-based chunking**

* **Primary unit**: one chunk per section
* **Context**: store adjacent sections in `prev_section_text` / `next_section_text`
* **Metadata**: keep titles, URLs, and breadcrumbs for attribution and navigation

### Step 4: Embed and Ingest

Embed and upload points with all three vectors and the payload fields you need for display and filters.

**Sample Models to Test**:
- **Dense (Primary Retrieval)**: Use `BAAI/bge-small-en-v1.5` for speed or `BAAI/bge-base-en-v1.5` for higher quality. For multilingual documentation, consider `intfloat/multilingual-e5-base`.
- **Multivector (Reranking)**: Implement late-interaction scoring with ColBERTv2. This provides token-level precision for distinguishing between similar sections.
- **Sparse (Lexical)**: Start with BM25-style sparse weights for exact keyword matching. Optionally experiment with the SPLADE encoder.

### Step 5: Search Pipeline

Convert user queries into the three vector representations needed for hybrid search. Use Qdrant’s Universal Query API to combine dense and sparse with server-side fusion.

**Multistage pipeline**

* **Stage 1 – Hybrid retrieval**: dense + sparse with RRF (or DBSF). Retrieve 50–200 candidates to get good recall.
* **Stage 2 – Multivector reranking**: apply token-level late interaction (MAX_SIM) to the candidates.

### Step 6: Result Formatting

Transform raw results into user-friendly output: page title, section title, URLs, scores, and a short contextual snippet that explains the match.

### Step 7: Analyze Your Results

Build a small eval set and measure quality and latency. Use results to guide tuning (fusion strategy, candidate sizes, search-time `ef`, etc.).

**Ground Truth**:
- Create 20–30 realistic queries with expected section URLs/anchors.
- Aim for diverse query types that cover how-to, concepts, API usage, and troubleshooting.

```python
ground_truth_examples = [
    {
        "query": "how to configure HNSW parameters for better recall",
        "expected_urls": ["/docs/guides/configuration/#hnsw-parameters"],
        "query_type": "how-to"
    },
    {
        "query": "quantization memory reduction",
        "expected_urls": ["/docs/guides/quantization/", "/docs/concepts/optimization/"],
        "query_type": "concept"
    },
    {
        "query": "create collection with replication factor",
        "expected_urls": ["/docs/guides/distributed-deployment/#replication-factor"],
        "query_type": "api-usage"
    }
]
```

**Metrics to Track**:
- **Recall@10** measures whether your system finds the right answer in the top 10 results. Calculate this by checking if any of your top 10 results matches the expected URL or section anchor. A score of 0.8 means your system finds the correct answer 80% of the time.
- **Mean Reciprocal Rank (MRR)** measures how quickly users find the right answer. If the correct result is rank 1, you get a score of 1.0. If it's rank 2, you get 0.5. If it's not in the top 10, you get 0. This metric heavily weighs having the best answer at the top.
- **Latency P50/P95** measures real-world performance. P50 is the median response time (half of queries are faster), while P95 captures tail latency (95% of queries complete within this time). Both matter for user experience.

## Success Criteria

Your project succeeds when it shows production-ready search with measurable performance.

<input type="checkbox"> Complete end-to-end Jupyter notebook or app that runs against Qdrant Cloud  
<input type="checkbox"> Hybrid search implementation with dense, sparse, and multivector components  
<input type="checkbox"> Evaluation framework with realistic queries and gold standard answers  
<input type="checkbox"> Performance metrics showing Recall@10 ≥ 0.8 and reasonable latency  
<input type="checkbox"> Clear documentation of design decisions and their rationale  
<input type="checkbox"> Reproducible results with documented configuration

## Share Your Discovery

### Step 1: Reflect on Your Findings

As you test your search engine, consider:

* **Chunking granularity:** Are sections large enough to answer questions but small enough for precision?
* **Payload design:** Do fields help attribution, filtering, and evaluation without bloat?
* **Fusion strategy:** Which works better for you, RRF or DBSF?
* **Reranking approach:** What’s the right candidate limit (50/100/200) to feed the multivector stage, and what’s the best approach to aggregate token-level scores?
* **Rerank or not:** Are multivectors worth it, or is fusion alone enough?
* **Performance tuning:** Which search and HNSW settings hit your accuracy/latency goals?

  * Search time: raise `ef` from 64 → 128 → 256 until gains flatten.
  * Index time (if rebuilding): try higher `m` (16, 32) and `ef_construct` (200, 400).

### Step 2: Post Your Results

Show your run and learn from others. **Post your results in** <a href="https://discord.com/invite/qdrant" target="_blank" rel="noopener noreferrer" aria-label="Qdrant Discord"> <img src="https://img.shields.io/badge/Qdrant%20Discord-5865F2?style=flat&logo=discord&logoColor=white&labelColor=5865F2&color=5865F2"
    alt="Post your results in Discord"
    style="display:inline; margin:0; vertical-align:middle; border-radius:9999px;" /> </a> **using this copy-paste template:**

```markdown
**[Day 6] Final Project: Production-Ready Documentation Search Engine**

**High-Level Summary**
- **Domain:** "Documentation search for <product>"
- **Key Result:** "Hybrid + multivector reranking reached Recall@10=<value> with P95=<ms>."

**Reproducibility**
- **Notebook/App:** <link>
- **Repo (optional):** <link>
- **Models:** dense=<id>, sparse=<method>, colbert=<id>
- **Collection:** docs_search (Cosine), points=<count>
- **Dataset:** <N sections> from <source> (snapshot: YYYY-MM-DD)
- **Ground truth:** <M queries> (how-to / concept / api / troubleshooting)

**Settings (today)**
- **Chunking:** <one section per heading | other>
- **Payload fields:** <page_title, section_title, section_url, breadcrumbs, tags, prev/next>
- **Fusion:** <RRF/DBSF>, k_dense=<100>, k_sparse=<100>
- **Reranker:** ColBERT (MaxSim), top-k=<N>
- **Index/Search params:** ef=<...>, m=<...>, ef_construct=<...>  # if tuned

**Queries (examples)**
1) "<user query>"
Top 3:
  1) <section title> → <url> → <score>
  2) ...
  3) ...
2) "<second query>"
Top 3:
  1) ...
  2) ...
  3) ...

**Evaluation**
- Recall@10: <value> | MRR: <value> | P50: <ms> | P95: <ms>

**Why these matched**
- <one line>

**Surprise**
- "<…>"

**Next step**
- "<…>"
```

## Optional: Go Further

* Try different dense models (speed vs quality)
* Rebuild with higher `m` / `ef_construct` if your dataset is large
* Add filters (tags, section type) and measure impact
