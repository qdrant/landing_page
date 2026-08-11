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

<br>
Modules 1 through 3 gave you the building blocks: embeddings, collections, HNSW, hybrid retrieval, and filters. The next step is turning those building blocks into a complete system: designing the payload schema, choosing a retrieval pipeline, and deciding how to deploy it.

**Follow-along code**: [Module 4 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb)

## In This Module, You'll Learn

1. The Layers of the Stack
2. Worked Example: Designing a News Search System
3. Filtering
4. The Production RAG Pipeline
5. Deployment Options
6. Knowledge Check
7. References & Further Reading

## 1. The Layers of the Stack

Every vector search system, from a notebook prototype to a deployment serving millions of queries, is built from the same five layers. When something is slow, wrong, or expensive, the first diagnostic question is always the same: **Which layer is the problem in?**

- **Query layer**: Where user intent becomes a search. Embedding the query, choosing dense vs. sparse vs. hybrid, fusing results, and setting limits. This is the layer you worked in throughout Module 3.
- **Indexing layer**: The structures that make search fast: the HNSW graph for vectors (Module 2) and payload indexes for filter fields. Mistakes here rarely make results wrong. They make everything slow.
- **Storage layer**: Where points live: vectors, payloads, and IDs on disk and in memory. Decisions about what goes in each point's payload, and how big your vectors are, land here.
- **Knowledge layer**: The data itself and how it's prepared: chunking, embedding model choice, and payload schema design. Problems in this layer can't be fixed by tuning any other layer. Garbage in, garbage retrieved.
- **Distribution layer**: How the system grows beyond one machine: sharding, replication, and multi-node clusters. You don't need this on day one. Growing systems eventually do.

![The five layers of a vector search stack, from the query layer at the top down through indexing, storage, and knowledge to the distribution layer at the base.](/courses/beginners/module-4/layers.png)

### Key Insight

Every design decision belongs to a layer. "Add a payload index" is an indexing decision. "Chunk articles instead of embedding them whole" is a knowledge decision. "Move to three nodes" is a distribution decision. Once you sort decisions into layers, intimidating architecture diagrams become checklists.

## 2. Worked Example: Designing a News Search System

Here's the brief, the kind you'd get on a real project:

> Analysts at a research firm need to search global news that arrives continuously. They ask in plain language ("port congestion in Southeast Asia") and they scope every search by country, topic, date range, and source. Some queries name one specific thing, a company ticker or a ship name, that has to match exactly.

That's realistic, and it's messy in exactly the ways real projects are. We'll design it by answering five questions.

### Question 1: What Do the Queries Look Like?

*Natural language? Exact tokens? Both?*

Both, and this is the single most consequential observation in the whole design. "Port congestion in Southeast Asia" is semantic intent: dense territory. "MAERSK-B.CO" is an exact token that carries no meaning a dense model can use, so dense search blurs it into neighboring tickers. You saw this failure in Module 3, retrieving exact IDs like `SKU-48291`.

**Decision**: Hybrid search: named dense and sparse vectors on every point, fused at query time. *(Query layer.)*

The examples here use `BAAI/bge-small-en-v1.5`, which produces 384-dimensional vectors. Any embedding model works; this one is small, fast to download, and it's what FastEmbed uses by default.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="https://YOUR-CLUSTER.cloud.qdrant.io", api_key="YOUR_API_KEY")

client.create_collection(
    collection_name="news",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(
            # Required for correct BM25 scoring, as discussed in Module 3
            modifier=models.Modifier.IDF
        ),
    },
)
```

### Question 2: What Must the System Filter On?

*Which constraints are hard rules, not similarity signals?*

From the brief: country, topic, date range, and source. These aren't "nice to rank higher" signals. An analyst scoping to "Vietnam, last seven days" means exactly that. Hard rules go in the payload; Section 3 covers why this works at speed.

**Decision**: The payload schema, designed before ingestion:

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

Create those indexes in the same setup step, before a single point is uploaded. This ordering is not a style preference. Qdrant extends the HNSW graph with extra edges derived from indexed payload values, and it can only add those edges for indexes that already exist when the graph is built. An index created after ingestion still filters correctly and still tells Qdrant how many points a filter will match, but getting those extra edges means rebuilding the HNSW index, which is slow and expensive on millions of points. *(Knowledge and indexing layers.)*

The build order for any collection you filter on is:

- create the collection
- create every payload index
- ingest

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

Millions of articles, text-only for now, arriving continuously. Hundreds of thousands of new chunks per day, and analysts expect this morning's news to be searchable this morning.

**Decisions**: One collection, and continuous upserts rather than periodic rebuilds. An upsert writes a point if its ID is new and replaces it if the ID already exists, so the same call handles both new articles and corrections. Two things still need designing here.

First, the initial backfill, the one-off load of every article you already have, is a bulk load rather than a stream. Batch your upserts, and consider disabling indexing for the duration so the index gets built once at the end instead of being rebuilt as data lands. Leaving HNSW index building on during a large load is a common way to saturate CPU and push query latency up for everything else on the cluster.

Second, Qdrant does index as it ingests, but not instantly. Points are stored in segments, self-contained slices of the collection, and Qdrant builds an HNSW index for a segment only once that segment grows past a threshold. Until then the segment is searched by scanning it. That is what makes fresh news searchable within minutes, and it is also the thing to monitor: if the number of unindexed points keeps climbing, ingestion is outpacing indexing and needs either more resources or a slower write path. *(Storage and knowledge layers.)*

### Question 4: What Does the Retrieval Pipeline Look Like?

*Dense-only? Hybrid? Reranking?*

Start with the simplest pipeline that fits the query analysis: hybrid (from Question 1) plus filters (from Question 2), fused with Reciprocal Rank Fusion. No reranker yet. Add one only if evaluation shows fused results need refinement. Add complexity when data proves it's needed, never in advance.

One knowledge-layer decision hides in here: **what you embed matters as much as how you search it.** A news article runs 800 words, and the ticker from Question 1 is one token inside it. Embed the whole body and that token is averaged into a vector about shipping in general. Embed the headline and the lead paragraph, keep the full text in the payload, and both retrievers get a shot at it: the dense vector stays about one story, and the sparse vector still sees every token. No amount of query-layer tuning recovers a signal the embedding dropped.

Note where the filter goes. It belongs inside each `Prefetch`, so that both retrievers search only the valid subset:

```python
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
        models.Prefetch(query=dense_vec,  using="dense",  filter=news_filter, limit=50),
        models.Prefetch(query=sparse_vec, using="sparse", filter=news_filter, limit=50),
    ],
    query=models.RrfQuery(rrf=models.Rrf()),
    limit=10,
)
```

Reciprocal Rank Fusion is the right default because it works from ranks rather than raw scores, so it doesn't care that cosine similarity and BM25 live on different scales. One alternative is worth knowing about once you can measure quality: Distribution-Based Score Fusion (`models.FusionQuery(fusion=models.Fusion.DBSF)`) normalizes each retriever's score distribution instead of using ranks. Neither reliably beats the other, so choose between them with an evaluation set rather than by reputation. Without one, stay on Reciprocal Rank Fusion. *(Query layer, with one knowledge-layer dependency.)*

### Try It: Why Hybrid, Not Dense Alone

The [notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb) runs the query `MAERSK-B.CO delisting` three ways against nine articles, two of which have near-identical headlines and differ only in the ticker.

Dense search puts the right article first, but the correct article scores 0.8120 and the decoy scores 0.6956, a gap of 0.12. BM25 scores the same pair 11.79 and 2.59, separating them by more than 4x. On nine articles, that thin dense margin still lands the right answer. On nine million, with thousands of similar market stories, it's noise.

Run it, then change the query to `HLAG-D.DE delisting` and watch which retriever keeps up.

### Question 5: What Are the Deployment Constraints?

*Latency budget, data residency, cost, and who operates this thing?*

A research firm with a small engineering team, no residency restrictions, and a "please don't page us at night" operational budget points to a managed deployment. The same design would run self-hosted if the constraints said otherwise. The design and the deployment mode are independent decisions; Section 5 lays out the full option space. *(Distribution layer.)*

### The Design on One Page

| Question | Answer for this system | Layer |
|----------|------------------------|-------|
| Query type | Mixed semantic + exact, so hybrid with Reciprocal Rank Fusion | Query |
| Filter scope | country, topic, source, date, indexed before ingestion | Knowledge, indexing |
| Workload shape | Millions of text chunks: bulk backfill, then continuous ingestion | Storage, knowledge |
| Pipeline | Hybrid + per-prefetch filters; headline and lead embedded; no reranker yet | Query, knowledge |
| Deployment | Managed; design independent of the choice | Distribution |

### Key Insight

Every piece of this design already appeared in an earlier module: the Module 2 pipeline, the Module 3 hybrid pattern, and a payload schema. What's new is the order of operations. You decided what to filter on and created the indexes before the first point went in. That ordering is the difference between a system that scales and one that gets re-ingested three times. Run the five questions on anything you're asked to design, starting with the capstone in Module 5.

## 3. Filtering

Filters showed up in every module so far: a `must` condition here, a date range there. Time to treat filtering as what it is in production: **the feature that decides whether your results are correct**, not an accessory to similarity.

### How Qdrant Combines Filters With Vector Search

The naive approach is post-filtering: retrieve the top K by similarity, then discard whatever fails the filter. With a selective filter, say one country out of 200 or one week out of a decade of archives, the top K can contain zero valid results. Retrieving a bigger K to compensate gets slow fast, and there's no K that guarantees correctness.

Qdrant doesn't work that way. A query planner chooses a strategy for each segment, based on how many points it estimates the filter will match and on which payload indexes exist:

- When the filter matches a large share of the collection, Qdrant walks the HNSW graph as usual and skips points that fail the filter during traversal.
- When the filter matches very few points, Qdrant can skip the graph entirely and retrieve through the payload index, which is cheaper at that selectivity.
- When a segment is small enough, scanning it outright wins.

The middle ground is the hard case. A strict filter can disconnect the HNSW graph, leaving relevant points unreachable no matter how long you search. Qdrant handles this by extending the graph with additional edges derived from indexed payload values, which is the reason payload indexes have to exist before the graph is built. Those extra edges are added per index, not per combination of indexes, so a query combining two or more highly selective filters can still miss part of the graph. There's a search mode for that case, [covered in the docs](/documentation/search/search/#acorn-search-algorithm), which you turn on per query once you have a workload that needs it.

The practical takeaway: filtering on every query is safe and fast, as long as every filtered field is indexed and the indexes existed before ingestion. It isn't free, and combinations of highly selective filters deserve measurement rather than assumption.

### Common Mistake: Filters in the Wrong Place

There are two places the client will accept a filter on a hybrid query. Inside each `Prefetch`, the way Question 4 does it, or as `query_filter` on the outer query, next to `prefetch`.

Use the first one. A server applies the outer filter, but local mode ignores it, and nothing raises an error either way. That's how a notebook ends up returning results that violate its own filter while looking perfectly healthy. The [notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb) runs the same filter both ways: on the outer query it returns five results, four of which break the filter, and inside the prefetches it returns the one valid point.

A per-prefetch filter also does something the outer one can't: it narrows what each retriever searches, rather than trimming a candidate list both retrievers have already built.

### The Filter Toolbox

| Condition | Logic | Example from the news system |
|-----------|-------|------------------------------|
| must | AND: all conditions true | country = VN AND topic = shipping |
| should | OR: at least one true | topic = shipping OR topic = logistics |
| must_not | Exclude matches | Exclude source = press-release wire |
| Range | Numeric or datetime bounds | published_at within the last seven days |
| Geo | Radius, bounding box, or polygon | Events within 100 km of a port |
| MatchAny | Value in a set | source in ["reuters", "nikkei", "caixin"] |
| Nested | Conditions inside array payloads | Any mention with company = X AND sentiment < 0 |

Conditions compose. A realistic analyst query combines `must` (country), `Range` (recency), `MatchAny` (sources), and `must_not` (excluded wires) in one filter, evaluated together while the search runs.

### Index What You Filter

The rule: **every field you filter on gets a payload index**, with a schema type matching the data.

Skipping this costs more than a slow scan. The payload index is also what lets Qdrant estimate how many points a filter will match, and that estimate is what the query planner uses to choose a strategy at all. Without it, the planner is guessing, and it can fall back to comparing the query against every vector in the collection. Because the query still returns results, just slowly, a missing index can sit in production unnoticed for months. Strict mode closes that gap: set `unindexed_filtering_retrieve` to `false` and Qdrant rejects any query that filters on an unindexed field instead of quietly degrading. Qdrant Cloud applies this by default.

Schema types: `KEYWORD` for exact strings, `UUID` for identifiers in UUID form, `INTEGER` and `FLOAT` for numbers, `BOOL` for flags, `DATETIME` for timestamps, `GEO` for coordinates, and `TEXT` for full-text conditions.

### A Special Case Worth Knowing: Scoping by User or Tenant

One filtering pattern deserves a call-out because you'll meet it in almost any multi-user product: **scoping every query to one user's (or one customer's) data.** The instinct is to create a collection per user. With many users, that becomes thousands or millions of collections, which is operationally unmanageable. The standard pattern instead:

1. Add a `tenant_id` (or `user_id`) payload field to every point at ingestion.
2. Create a payload index on it, with `is_tenant=True` so Qdrant knows this field identifies tenants and can keep each tenant's data close together on disk. Tenant optimization is supported for the `keyword` and `uuid` index types.
3. Filter on it at every query. Never omit it.

```python
client.create_payload_index(
    collection_name="news",
    field_name="tenant_id",
    field_schema=models.KeywordIndexParams(
        type=models.KeywordIndexType.KEYWORD,
        is_tenant=True,
    ),
)
```

That gives you one collection with complete per-tenant isolation at query time. Step 2 is what keeps it fast as tenant count grows, and it's easy to skip, because steps 1 and 3 alone are already correct: they just get slower than they need to. See the [multitenancy guide](/documentation/manage-data/multitenancy/) for the full pattern, including the tenant-aware vector index configuration for collections with very many tenants.

### Key Insight

Design the payload schema before you ingest, driven by one question: what will I need to filter on? Time, geography, identity, permissions, and status flags are the usual suspects. Adding a payload *field* later is easy. Adding a payload *index* later costs an HNSW rebuild before it's fully effective, and discovering at query time that you never stored the publication date at all means re-ingesting everything.

## 4. The Production RAG Pipeline

Retrieval-Augmented Generation (RAG) is the pattern of retrieving relevant passages from a vector search engine and handing them to a large language model as context, so the model answers from your data instead of relying only on what it memorized during training. If the news system grows an "ask a question, get an answer with sources" feature, it becomes a RAG pipeline, the most common architecture built on vector search today. The production shape, using everything covered so far:

1. **Query understanding**: Extract hard constraints from the request (dates, country, topic) into a filter. Embed the query as a dense vector and a sparse vector.
2. **Hybrid retrieval**: `Prefetch(dense, filter, limit=50)` + `Prefetch(sparse, filter, limit=50)`, then `RrfQuery`, returning the top 20 candidates. One `query_points` call, with the filter on each prefetch rather than on the outer query.
3. **Optional reranking**: A cross-encoder, a model that scores a query and a passage together rather than embedding each separately, reorders the top 20 and keeps the top five. Add this stage only when evaluation shows fused results need refinement.
4. **LLM generation**: The top passages go in as context; the model generates the answer.

### Rule of Thumb

When RAG quality disappoints, improve step 2 before reaching for a bigger model in step 4. Retrieval quality caps answer quality: the model can't cite a passage it never received.

Formula queries let you layer payload-aware scoring on top of a fused result, for example boosting recent articles over stale ones, or demoting items a user already dismissed. You won't need them for the capstone; the course's closing video points you there as a further-learning topic.

## 5. Deployment Options

The news system's design runs unchanged on any deployment mode. Which one is right depends on constraints, not sophistication.

| Deployment Mode | Use When | Avoid When |
|-----------------|----------|------------|
| Local Mode | Prototyping, notebooks, CI tests, teaching | Production or benchmarking (different storage format) |
| Docker (Self-Hosted) | Full infra control, air-gapped, regulated environments | You don't yet have monitoring and backups in place |
| Managed Cloud | Small ops team, standard requirements: upgrades, backups, and high availability handled for you | Data can't leave your infrastructure |
| Hybrid Cloud (Bring Your Own Kubernetes) | Data residency or security policy requires your infrastructure | Managed cloud would meet your needs with less operational overhead. Hybrid Cloud adds Kubernetes complexity that isn't always necessary |
| Private Cloud / On-Prem | Strictest requirements: defense, healthcare, finance | A lighter mode meets your needs |
| Edge | On-device search, offline, ultra-low latency | You need distributed search (Edge is single-node) |

![Qdrant deployment modes, from Local Mode and Docker through Managed Cloud, Hybrid Cloud, and Private Cloud to Edge, each mapped to when to use it and when to avoid it.](/courses/beginners/module-4/deployment.png)

One caveat about Local Mode, since it's where you'll run the course notebooks. It's a Python-only reimplementation, not the engine: search is exact rather than approximate, payload indexes have no effect, and a filter on the outer query is ignored. Everything in Section 3 is still worth understanding while working locally, but none of it is observable there. Verify indexing and filtering behavior against a real server, whether in Docker or in Qdrant Cloud, before trusting numbers from a notebook.

## 6. Knowledge Check

Work through these before starting the capstone.

{{< details summary="Name the five layers of a vector search stack, and place 'chunk articles instead of embedding them whole' in the right one." >}}
Query, indexing, storage, knowledge, distribution. Chunking is a knowledge-layer decision, and mistakes there can't be fixed by tuning other layers.
{{< /details >}}

{{< details summary="In the news system, why is hybrid retrieval chosen from the start rather than dense-only?" >}}
Query analysis showed a mix of semantic intent (port congestion) and exact tokens (tickers, ship names). A ticker carries no semantics for a dense model, so the dense gap between the right article and a near-identical one is thin, 0.12 in the notebook. BM25 separates the same pair by more than 4x.
{{< /details >}}

{{< details summary="What's wrong with post-filtering, and how does Qdrant avoid it?" >}}
Post-filtering retrieves the top K first and discards invalid results, so a selective filter can leave zero valid points. Qdrant's query planner instead picks a strategy per segment from the estimated filter cardinality: skip non-matching points during graph traversal, retrieve through the payload index when very few points match, or scan a small segment.
{{< /details >}}

{{< details summary="In a hybrid query, where does the filter belong, and what happens if you put it at the top level?" >}}
Inside each `Prefetch`, which narrows what each retriever searches and behaves the same everywhere. An outer `query_filter` is applied by a server but ignored in local mode, so a notebook can print results that break its own filter without raising an error.
{{< /details >}}

{{< details summary="Why create payload indexes before ingestion rather than after?" >}}
The filterable HNSW graph gains filter-aware edges only for indexes that exist when the graph is built. An index created later still filters and still feeds the planner's cardinality estimate, but getting those edges means rebuilding the HNSW index.
{{< /details >}}

{{< details summary="Why does per-user scoping use a payload filter instead of one collection per user?" >}}
Collections don't scale to millions of users operationally. An indexed `tenant_id` payload field, filtered on at every query, gives complete isolation in one collection. Marking that index with `is_tenant=True` is what keeps it fast as tenant count grows.
{{< /details >}}

{{< details summary="In the RAG pipeline, which step should you improve first when answer quality disappoints, and why?" >}}
Step 2, retrieval. Retrieval quality caps answer quality, since the model can't cite a passage it never received. Improving the retriever beats scaling the LLM.
{{< /details >}}

{{< details summary="When would you choose Hybrid Cloud over managed cloud, and when would you not?" >}}
Choose it when data residency or security policy requires your own infrastructure. Otherwise skip it: it adds Kubernetes operational complexity you don't need.
{{< /details >}}

## 7. References & Further Reading
- [Hybrid Queries](/documentation/search/hybrid-queries/)
  - Prefetch semantics, Reciprocal Rank Fusion with weights, Distribution-Based Score Fusion, and formula queries.
- [Indexing and Filterable HNSW](/documentation/manage-data/indexing/)
  - Payload index types, why indexes come before ingestion, and how to rebuild an HNSW index.
- [Query Planning](/documentation/search/search/#query-planning)
  - How Qdrant chooses between graph traversal, payload index lookup, and a full scan for each segment.
- [Filtering](/documentation/search/filtering/)
  - Full filter syntax: must, should, must_not, min_should, range, geo, and nested conditions.
- [Multitenancy](/documentation/manage-data/multitenancy/)
  - Payload-based tenant scoping, tenant indexes, and when a tenant-aware vector index is worth it.
- [Bulk Upload](/documentation/manage-data/bulk-upload/)
  - Batch sizes, index ordering, and disabling indexing during a large initial load.
- [Hybrid Search with FastEmbed](/documentation/tutorials-develop/hybrid-search-fastembed/)
  - Dense and sparse retrieval end to end with rank fusion, as runnable code.
- [Deploy Qdrant](/documentation/deploy-intro/)
  - Every deployment mode with its configuration reference.
- [Qdrant Cloud](https://cloud.qdrant.io/)
  - Create a free cluster before Module 5, so the capstone runs against a real server instead of local mode.

## What's Next: Module 5

Next, the capstone extends the system you just designed. Same design questions, bigger answers:

- Ingest daily news, audio, and satellite imagery about suppliers: three modalities instead of one
- Embed each modality into named vectors on shared points
- Cluster signals into risk themes across suppliers
