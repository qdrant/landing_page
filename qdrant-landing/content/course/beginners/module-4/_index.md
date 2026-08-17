---
title: "Module 4: Designing a Vector Search System"
short_description: "Module 4 of the Beginners course: how to design a vector search system, covering layers, filtering, RAG, and deployment."
description: "Design a vector search system: the layers of the stack, five design questions, filtering, a production RAG pipeline, and deployment options."
isLesson: true
weight: 50
---

{{< date >}} Module 4 {{< /date >}}

# Designing a Vector Search System

<div class="video">
  <iframe src="https://www.youtube.com/embed/0qQ3B9uirz0?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
  </iframe>
</div>

#### TL;DR
```
Module 3 gave you hybrid retrieval. In this module, you'll learn how to
turn the building blocks into a system. You'll explore the five layers of
a vector search stack and the five questions that turn a brief into a
design, then see how Qdrant plans a filtered query instead of discarding
results afterward. You'll also learn what a production RAG pipeline looks
like and how to pick a deployment mode. By the end, you'll have designed
a news search system end to end.
```

Modules 1 through 3 gave you the building blocks: embeddings, collections, HNSW, hybrid retrieval, and filters. This module turns them into a system, which means a payload schema, a retrieval pipeline, and a deployment mode.

**Follow-along code**: [Module 4 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb)

## Today's Path

1. The Layers of the Stack
2. Worked Example: Designing a News Search System
3. Filtering
4. The Production RAG Pipeline
5. Deployment Options
6. Knowledge Check
7. References & Further Reading

By the end, you'll be able to take a brief and turn it into a design, layer by layer.

## 1. The Layers of the Stack

Every vector search system is built from the same five layers. When something is slow, wrong, or expensive, the first diagnostic question is always the same: **which layer is the problem in?**

- **Query layer**: embedding the query, choosing dense, sparse, or hybrid, fusing results, setting limits. Module 3's territory.
- **Indexing layer**: the HNSW graph for vectors and payload indexes for filter fields. Mistakes here make things slow rather than wrong.
- **Storage layer**: vectors, payloads, and IDs on disk and in memory.
- **Knowledge layer**: the data and how it's prepared, meaning chunking, embedding model choice, and payload schema. Garbage in, garbage retrieved.
- **Distribution layer**: sharding, replication, and multi-node clusters. You won't need

Every design decision belongs to one of them: "add a payload index" is indexing, "chunk ang them whole" is knowledge, "move to three nodes" is distribution.

![The five layers of a vector search stack, from the query layer at the top down through wledge to the distribution layer at the base.](/courses/beginners/module-4/layers.png)

### Diagnose It

Three reports from a running system. Name the layer responsible for each before opening t

1. Searches scoped to one country take four seconds. The same search without the country ds.
2. Analysts searching a company ticker get the right company about half the time. The sys
3. The memory bill doubled after the team added a second language, though the number of a

<details>
<summary>Show the answers</summary>

1. Indexing layer. The country field has no payload index, so the planner cannot estimate falls back to scanning. Adding the index fixes it without touching the data or the query.
2. Query layer. A ticker is an exact token, and dense retrieval blurs it into neighboring tickers. The fix is hybrid retrieval, not a better dense model.
3. Storage layer. A second language means a second named vector on every point, which roue held in memory. The fix is a storage decision such as quantization or on-disk vectors,not a change to how you search.

</details>

## 2. Worked Example: Designing a News Search System

Here's the brief, the kind you'd get on a real project:

> Analysts at a research firm need to search global news that arrives continuously. They ask in plain language ("port congestion in Southeast Asia") and they scope every search by country, topic, date
range, and source. Some queries name one specific thing, a company ticker or a ship name,.

Five questions turn that into a design.

### Question 1: What Do the Queries Look Like?

*Natural language, exact tokens, or both?*

Both, and this is the most consequential observation in the design. "Port congestion in S intent, which is dense territory. "MAERSK-B.CO" is an exact token carrying no meaning a
dense model can use, so dense search blurs it into neighboring tickers, the failure from

**Decision**: hybrid search, with named dense and sparse vectors on every point, fused at.)*

```bash
pip install "qdrant-client[fastembed]"
```

Name both models once, as constants, and reuse them at ingestion and at query time:

```python
from qdrant_client import QdrantClient, models

DENSE_MODEL  = "BAAI/bge-small-en-v1.5"   # FastEmbed's default, 384 dimensions
SPARSE_MODEL = "Qdrant/bm25"

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="YOUR_API_KEY",
)

client.create_collection(
    collection_name="news",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(
            # Required for correct BM25 scoring, as covered in Module 3
            modifier=models.Modifier.IDF,
        ),
    },
)
```

### Question 2: What Must the System Filter On?

*Which constraints must hold on every result?*

Country, topic, date range, and source. An analyst scoping to "Vietnam, last seven days" expects those articles and no others, so these belong in the payload rather than the ranking.

**Decision**: the payload schema, designed before ingestion.

```yaml
payload:
  country: string         # indexed
  topic: string           # indexed
  source: string          # indexed
  published_at: datetime  # indexed
  headline: string        # returned, never filtered
  lead: string            # returned, never filtered
  body: string            # returned, never filtered
```

Create the indexes before a single point is uploaded. Qdrant adds filter-aware edges to t payload values, and only for indexes that exist when the graph is built. An index created
later still filters correctly, but earning those edges means an [HNSW rebuild](/documenta). So the build order is: create the collection, create every payload index, then ingest.
*(Knowledge and indexing layers.)*

```python
for field in ["country", "topic", "source"]:
    client.create_payload_index(
        collection_name="news",
        field_name=field,
        field_schema=models.PayloadSchemaType.KEYWORD,
    )

client.create_payload_index(
    collection_name="news",
    field_name="published_at",
    field_schema=models.PayloadSchemaType.DATETIME,
)
```

### Question 3: What's the Workload Shape?

*How much data, in what modalities, arriving how fast?*

Millions of articles, text-only, arriving continuously, and analysts expect this morning'is morning.

**Decision**: one collection, and continuous upserts rather than periodic rebuilds. An up ID is new and replaces it if the ID exists, so one call handles new articles andcorrections.

The one-off backfill of everything you already have is different: batch it, and consider it finishes](/documentation/manage-data/bulk-upload/). After that, Qdrant indexes as itingests, but not instantly, so watch the count of unindexed points. If it keeps climbing, ingestion is outpacing indexing. *(Storage and knowledge layers.)*

### Question 4: What Does the Retrieval Pipeline Look Like?

*Dense-only, hybrid, or reranked?*

The simplest pipeline that fits the query analysis: hybrid from Question 1, plus filters h Reciprocal Rank Fusion. No reranker yet.

One knowledge-layer decision hides in here: **what you embed matters as much as how you s runs 800 words, and the ticker from Question 1 is one token inside it. Embed the whole
body and that token is averaged into a vector about shipping in general. Embed the headlieep the full text in the payload, and the dense vector stays about one story.

The filter goes inside each `Prefetch`, so both retrievers search only the valid subset.

```python
QUERY = "port congestion in Southeast Asia"

news_filter = models.Filter(
    must=[
        models.FieldCondition(key="country", match=models.MatchValue(value="VN")),
        models.FieldCondition(
            key="published_at",
            range=models.DatetimeRange(gte="2026-07-01T00:00:00Z"),
        ),
    ]
)

results = client.query_points(
    collection_name="news",
    prefetch=[
        # Both prefetches reuse the constants from Question 1, so the query is
        # always embedded by the same model that produced the stored vectors
        models.Prefetch(
            query=models.Document(text=QUERY, model=DENSE_MODEL),
            using="dense", filter=news_filter, limit=50,
        ),
        models.Prefetch(
            query=models.Document(text=QUERY, model=SPARSE_MODEL),
            using="sparse", filter=news_filter, limit=50,
        ),
    ],
    query=models.RrfQuery(rrf=models.Rrf()),
    limit=10,
)
```

### Question 5: What Are the Deployment Constraints?

*Latency budget, data residency, cost, and who operates this?*

A small engineering team, no residency restrictions, and a "please don't page us at nightd deployment. The same design runs self-hosted if the constraints say otherwise, so treatthe design and the deployment mode as independent decisions. *(Distribution layer.)*

### Try It: Why Hybrid, Not Dense Alone

The [notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb) runs `MAERSK-B.CO delisting` against nine articles, two of which differ only in the ticker. Dense search puts
the right one first, but scores it 0.8120 against the decoy's 0.6956, a gap of 0.12. BM259 and 2.59. On nine articles that thin dense margin still lands the right answer; on ninemillion it's noise.

Now run a query with no exact token in it, such as `shipping delays across Asian ports`, iever contributes. The ticker query is where sparse rescues dense. This one runs the other way.

### The Design on One Page

| Question | Answer for this system | Layer |
|----------|------------------------|-------|
| Query type | Mixed semantic and exact, so hybrid with Reciprocal Rank Fusion | Query |
| Filter scope | country, topic, source, date, indexed before ingestion | Knowledge, inde
| Workload shape | Millions of articles: bulk backfill, then continuous ingestion | Stora
| Pipeline | Hybrid with per-prefetch filters; headline and lead embedded; no reranker ye
| Deployment | Managed; design independent of the choice | Distribution |

Run these five questions on anything you're asked to design, starting with the capstone in Module 5.

## 3. Filtering

Module 3 covered how to write a filter and where to put it in a hybrid query. What's new ith one.

The naive approach is post-filtering: retrieve the top K by similarity, then discard whath a selective filter, one country out of 200, even a large K can come back empty. Qdrant
works differently. A [query planner](/documentation/search/search/#query-planning) estimalter will match and picks a strategy per segment: walk the HNSW graph and skipnon-matching points, use the payload index when very few match, or scan a small segment. That estimate comes from the payload index, so an unindexed field leaves the planner guessing and the query slow rather than wrong, which is how a missing index sits in production unnoticed for months.

### The Filter Toolbox

| Condition | Logic | Example from the news system |
|-----------|-------|------------------------------|
| must | AND: all conditions true | country = VN AND topic = shipping |
| should | OR: at least one true | topic = shipping OR topic = logistics |
| must_not | Exclude matches | Exclude source = press-release-wire |
| Range | Numeric or datetime bounds | published_at within the last seven days |
| Geo | Radius, bounding box, or polygon | Events within 100 km of a port |
| MatchAny | Value in a set | source in ["reuters", "nikkei", "caixin"] |

Conditions compose. A realistic analyst query combines `must`, `Range`, `MatchAny`, and `valuated together while the search runs.

### Key Insight

Design the payload schema before you ingest, driven by one question: what will I need to , identity, permissions, and status flags are the usual suspects. A payload index added
later costs an HNSW rebuild before it's fully effective, and a field you never stored at rything.

## 4. The Production RAG Pipeline

**Retrieval-Augmented Generation (RAG)** is the pattern behind "ask a question, get an an than trusting a large language model to recall a fact from training, you retrieve therelevant chunks from your own data and hand them to the model as context, so it answers from what you gave it. [What is RAG](/articles/what-is-rag-in-ai/) covers the pattern in depth.

Give the news system that feature and the pipeline has four steps:

1. **Query understanding**: pull hard constraints (dates, country, topic) into a filter, and embed the query as a dense vector and a sparse vector.
2. **Hybrid retrieval**: one `query_points` call, filtered on each prefetch, fused with `op 20 chunks.
3. **Optional reranking**: **reranking** is a second scoring pass over a short list. A cross-encoder reads the query and a chunk together rather than embedding each separately, which is more accurate and far too slow to run over a whole collection, so it reorders those 20 and keeps five. Add it when the right chunk keeps landing at position 8 instead of position 2. [Reranking in semantic
search](/documentation/search-precision/reranking-semantic-search/) compares the types an
4. **Generation**: the top chunks go in as context and the model writes the answer.

### Rule of Thumb

When RAG quality disappoints, improve step 2 before reaching for a bigger model in step 4nswer quality: the model cannot cite a chunk it never received.

## 5. Deployment Options

The design runs unchanged on any of these. Which one is right depends on your constraints

| Deployment Mode | Use When | Avoid When |
|-----------------|----------|------------|
| Local Mode | Prototyping, notebooks, CI tests, teaching | Production or benchmarking |
| Docker (self-hosted) | Full infrastructure control, air-gapped or regulated environments | You don't yet have monitoring and backups |
| Managed Cloud | Small ops team, with upgrades, backups, and high availability handled fyour infrastructure |
| Edge | On-device search, offline, ultra-low latency | You need distributed search, sinc

Three further modes exist for stricter requirements: Hybrid Cloud runs Qdrant on your ownloud and on-premise deployments suit defense, healthcare, and finance. [Deploy
Qdrant](/documentation/deploy-intro/) covers all of them.

One caveat about Local Mode, since it's where you'll run the course notebooks. It's a Pytr than the engine: search is exact instead of approximate, payload indexes have no effect, and a filter on the outer query is ignored. Verify against a real server before trusting numbers from a notebook.

## 6. Knowledge Check

A new brief, not the one you just designed:

> A SaaS company wants to search its own support tickets. Agents describe a problem in their own words ("customer can't log in after SSO change") and often paste an error code such as `AUTH-5521`. Every search must be scoped to the agent's own product line, and to tickets from the last two years. There are four million tickets, arriving a few thousand a day.

Work through the five questions before opening the answers.

<details>
<summary>Question 1: What do the queries look like?</summary>

Both kinds, exactly as in the news system. The problem description is semantic; the error code is an exact token that a dense model will blur into neighboring codes. So: hybrid, with named dense and sparse
vectors, fused with Reciprocal Rank Fusion. (Query layer.)

</details>

<details>
<summary>Question 2: What must the system filter on?</summary>

Product line and ticket date, both indexed before ingestion. Product line is a keyword index, date is a datetime index. Anything the agent must never see across product lines is a filter, not a ranking
signal.

</details>

<details>
<summary>Question 3: What's the workload shape?</summary>

Four million text tickets, a few thousand new per day. That is a bulk backfill followed by light continuous ingestion, so one collection, upserts, and no distribution-layer work on day one.

</details>

<details>
<summary>Question 4: What does the retrieval pipeline look like?</summary>

Hybrid retrieval with the filter inside each prefetch. The knowledge-layer decision is what to embed: a ticket thread can run long, so embed the subject and the first message rather than the entire thread, and keep the full thread in the payload. Add a reranker only if evaluation shows the right ticket landing below the fold.

</details>

<details>
<summary>Question 5: What are the deployment constraints?</summary>

Not stated in the brief, which is the point. Ask before you choose. Support tickets oftenhe answer usually turns on where that data is allowed to live rather than on latency orcost.

</details>

## 7. References & Further Reading

- [Hybrid Queries](/documentation/search/hybrid-queries/): prefetch semantics, both fusion strategies, and their parameters.
- [Indexing and Filterable HNSW](/documentation/manage-data/indexing/): payload index types, filter-aware edges, and rebuilding an index.
- [Query Planning](/documentation/search/search/#query-planning): how Qdrant picks a stra
- [What is RAG](/articles/what-is-rag-in-ai/): retrieval-augmented generation, end to end.
- [Reranking in Semantic Search](/documentation/search-precision/reranking-semantic-search/): which reranker types fit which budget.
- [Deploy Qdrant](/documentation/deploy-intro/): every deployment mode with its configuration reference.
- [Qdrant Cloud](https://cloud.qdrant.io/): create a free cluster before Module 5, so theeal server.

## What's Next: Module 5

The capstone extends the system you just designed. Same five questions, bigger answers:

- Ingest daily news, audio, and satellite imagery about suppliers, so three modalities instead of one
- Embed each modality into named vectors on shared points
- Cluster signals into risk themes across suppliers
- Query across languages: ask in English, retrieve Japanese and Chinese sources
