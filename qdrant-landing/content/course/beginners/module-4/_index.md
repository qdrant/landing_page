---
title: "Module 4: Designing a Vector Search System"
short_description: "Module 4 of the Beginners course: how to design a vector search system, covering layers, filtering, RAG, and deployment."
description: "Design a vector search system: the layers of the stack, five design questions, filtering, a production RAG pipeline, and deployment options."
isLesson: true
weight: 50
draft: false
---

{{< date >}} Module 4 {{< /date >}}

# Designing a Vector Search System

<div class="video">
  <iframe src="https://www.youtube.com/embed/0qQ3B9uirz0?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
  </iframe>
</div>

Hybrid retrieval, vector indexes, and payload indexes are the parts. This module is the reasoning that turns them into a system: five layers, five questions, and a news search design built end to end.

**Follow-along code**: [Module 4 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb)

---

## 1. The Layers of the Stack

Every vector search system is built from the same five layers. They matter because a symptom shows up in one place while the cause almost always lives in exactly one layer, so naming the layer is what narrows "search is bad" to a short list of things to change.

![The five layers of a vector search stack, from the query layer at the top down through indexing, storage, and knowledge to the distribution layer at the base.](/courses/beginners/module-4/layers.png)

**Query** runs once per request: embed the query, search dense, sparse, or both, merge the ranked lists, cut the result to a limit. All of Module 3 lives here, and so does every mistake you can fix by changing one call and running it again. No re-ingestion and no rebuild is this layer's tell.

**Indexing** holds the structures that make search fast rather than correct: the Hierarchical Navigable Small World (HNSW) graph over the vectors from Module 2, plus a payload index for every field you filter on. Get this layer wrong and the results are still right, they just arrive late. The fix costs a rebuild.

**Storage** is where points sit, split between RAM and disk, and it is the layer that sets the memory bill. Two levers here need only a change to the collection config, though on a collection that already holds data both rewrite every vector. [Quantization](/documentation/manage-data/quantization/) compresses each vector into fewer bytes, and [on-disk vectors](/documentation/manage-data/storage/#configuring-memmap-storage) keep them in memory-mapped files instead of RAM, trading latency for capacity.

**Knowledge** is the data itself and every decision made before it reached Qdrant: which text you embed, how long the pieces are, which model produced the vectors, and what the payload holds. Chunking belongs here too, splitting a long document into passages short enough that one vector still describes one thing. Nothing in the layers above recovers from a mistake in this one. Embed the wrong text and the only fix is embedding the right text and ingesting again.

**Distribution** is how one collection stops fitting on one machine. Sharding splits a collection's points across nodes so each node holds a slice. Replication keeps a copy of each shard on more than one node, so search survives losing one. A multi-node cluster is two or more Qdrant nodes serving one collection together. None of it is a day-one concern, and reaching for it to fix a latency problem that belongs to the indexing layer is the most expensive mistake on this page. [Distributed Deployment](/documentation/distributed_deployment/) covers all three.

### Diagnosing by Layer

Sorting a decision into a layer is the easy direction: "add a payload index" is indexing, "chunk long articles" is knowledge, "move to three nodes" is distribution. Going the other way, from a symptom to a layer, is the direction you will need, and a symptom almost never names its own layer. Work backwards from what the fix would cost instead.

Five reports from production systems. For each, name the layer and the one thing you would change. One of them has two defensible answers.

1. Latency is fine at the median and three seconds at the 99th percentile. The slow queries are the ones scoped to a single small source.
2. Analysts get good results on the English articles and poor ones on the Japanese articles, from the same query, with both in the collection.
3. A hybrid query returns nothing when an analyst asks for 50 results, and works fine when they ask for 10.
4. The collection is 40 GB and the node has 16 GB of RAM. Latency is an order of magnitude worse than the same collection on a laptop that could hold all of it.
5. One node serves the query load with room to spare. A disk failure last month took search down for six hours.

<details>
<summary>Show the Answers</summary>

1. **Indexing**, and this is the one with two answers. A filter on a small source matches few points, which is exactly the case a payload index on `source` exists to serve. Without that index the planner has no estimate to work from and the query degrades to a scan, on a self-hosted cluster at least, since [strict mode](/documentation/ops-configuration/administration/#strict-mode), on by default in Qdrant Cloud, rejects a filter on an unindexed field outright. Reading it as a query-layer problem is defensible, because a smaller limit would also cut the tail. It would hide the cause rather than fix it.
2. **Knowledge**. The embedding model is English-only, so the Japanese articles were never projected into a space an English query can reach. No filter, index, or limit recovers from that. The fix is a multilingual model and a re-ingestion.
3. **Query**. A hybrid query runs each retriever as a prefetch, a sub-query whose ranked results get fused, and every prefetch carries a limit of its own. That limit has to be at least the outer query's limit plus its offset, or fusion has fewer candidates than the result set asks for and comes back empty. Module 3 called this the prefetch-limit trap. Raise the prefetch limits above the largest outer limit the system serves, plus its offset.
4. **Storage**. Most of the collection cannot be held in RAM, so searches page in from disk. Quantization, on-disk vectors, or a bigger node are the levers, and none of them change how you search.
5. **Distribution**. A single copy of each shard means one disk failure is an outage. Replication is what makes search survive it, and it is the first distribution-layer decision worth making.

</details>

## 2. Worked Example: Designing a News Search System

Here's the brief, the kind you'd get on a real project:

> Analysts at a research firm need to search global news that arrives continuously. They ask in plain language ("port congestion in Southeast Asia") and they scope every search by country, topic, date range, and source. Perhaps a fifth of queries name one specific thing, a company ticker or a ship name.

Five questions turn that into a design.

### Question 1: What Do the Queries Look Like?

*Natural language, exact tokens, or both?*

Two queries from the brief pull in opposite directions. "Port congestion in Southeast Asia" describes an intent, which is dense territory. "MAERSK-B.CO" is a ticker, and it carries no meaning a dense model can use. Put it in a headline next to a near-identical headline about a different carrier and the model has nothing to separate them: the one token the analyst cares about gets averaged into a vector about shipping.

Module 3's failure arrives here in a new domain, which is why a fifth of the queries decide the whole design. Try It, at the end of this section, measures the margin dense-only leaves on exactly that pair.

**Decision**: hybrid search, with [named dense and sparse vectors](/documentation/manage-data/vectors/#named-vectors) on every point, fused at query time.

```bash
pip install "qdrant-client[fastembed]"
```

Name both models once and reuse them at ingestion and at query time. `models.Document` embeds locally through [FastEmbed](/documentation/fastembed/), which keeps this example self-contained; [Cloud Inference](/documentation/inference/cloud-inference/) does the same work server-side and is the production path.

```python
from qdrant_client import QdrantClient, models

DENSE_MODEL  = "sentence-transformers/all-MiniLM-L6-v2"   # Module 3's model, 384 dimensions
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

Country, topic, date range, and source. An analyst scoping to "Vietnam, last seven days" expects those articles and no others, so these are constraints, not ranking signals.

**Decision**: the payload schema, designed before ingestion. Build it by asking what you will need to filter on: country, topic, source, and date here, plus a tenant ID and access-control fields if one collection will serve more than one customer, the [multi-tenant](/documentation/manage-data/multitenancy/) case. A field you never stored costs a full re-ingestion. The block below is the schema, not code to run; the two after it build it.

```yaml
payload:
  country: string         # indexed
  topic: string           # indexed
  source: string          # indexed
  published_at: datetime  # indexed
  headline: string        # embedded and returned, never filtered
  lead: string            # embedded and returned, never filtered
  body: string            # returned only, never embedded or filtered
```

Create the indexes before a single point is uploaded. Qdrant adds extra edges to the HNSW graph for indexed payload values, and only for indexes that exist when the graph is built. Those edges are what make a **filterable HNSW index**, the structure Section 3 puts to work. A later index still filters correctly, but earning the edges means an [HNSW rebuild](/documentation/manage-data/indexing/). Build order: collection, every payload index, then ingest.

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

With the indexes in place, load a few articles. Each one carries a headline, a lead, and a body, and an [upsert](/documentation/manage-data/points/#upload-points) inserts a point if the ID is new and replaces it if the ID exists. Three articles here keep the page runnable; the notebook uses nine:

```python
ARTICLES = [
    {
        "country": "VN", "topic": "shipping", "source": "reuters",
        "published_at": "2026-07-15T08:00:00Z",
        "headline": "Port congestion worsens at Ho Chi Minh City terminals",
        "lead": "Waiting times at the city's two main container berths have roughly"
                " tripled since June, and carriers are diverting boxes to Cai Mep.",
        # a real body runs 600 to 900 words; shortened here
        "body": "Terminal operators said the backlog began with a monsoon shutdown",
    },
    {
        "country": "VN", "topic": "shipping", "source": "nikkei",
        "published_at": "2026-07-18T08:00:00Z",
        "headline": "MAERSK-B.CO delisting rumour denied by carrier",
        "lead": "The carrier called weekend reports of a Copenhagen delisting"
                " unfounded and said no board discussion has taken place.",
        "body": "Shares closed flat on Friday ahead of the statement",
    },
    {
        "country": "SG", "topic": "shipping", "source": "caixin",
        "published_at": "2026-07-20T08:00:00Z",
        "headline": "Singapore berth waiting times fall for a third week",
        "lead": "Average waits at Tuas dropped below 12 hours, easing a"
                " backlog that built through the second quarter.",
        "body": "The port authority attributed the improvement to two new berths",
    },
]

points = []
for i, article in enumerate(ARTICLES):
    # only the headline and lead are embedded, and both named vectors get the
    # same text; Question 4 covers why the body is left out
    embedded = f"{article['headline']}. {article['lead']}"
    points.append(
        models.PointStruct(
            id=i,
            vector={
                "dense": models.Document(text=embedded, model=DENSE_MODEL),
                "sparse": models.Document(text=embedded, model=SPARSE_MODEL),
            },
            # the whole article goes in the payload, body included
            payload=article,
        )
    )

client.upsert(collection_name="news", points=points)
```

### Question 3: What's the Workload Shape?

*How much data, in what modalities, arriving how fast?*

The brief says millions of articles, text-only, arriving continuously. Analysts expect this morning's news this morning.

**Decision**: one collection, and continuous upserts, not periodic rebuilds. One call handles new articles and corrections alike.

The one-off backfill is different. Batch it, and consider [disabling indexing until it finishes](/documentation/manage-data/bulk-upload/), so the graph is built once at the end instead of rebuilt as data lands. After the backfill Qdrant indexes as it ingests, though not instantly. `client.get_collection("news")` reports `points_count` and `indexed_vectors_count`, and the gap between them is the backlog. If that gap grows run after run, ingestion is outpacing indexing.

### Question 4: What Does the Retrieval Pipeline Look Like?

*Dense-only, hybrid, or reranked?*

The simplest pipeline that fits the query analysis: hybrid from Question 1, plus filters, fused with [Reciprocal Rank Fusion (RRF)](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf). No reranker yet, and Section 4 covers what one is and when to add it.

One knowledge-layer decision hides in here: **what you embed matters as much as how you search.** Question 1 showed one ticker averaged away inside a single headline; an 800-word body does that to every specific in the article. Embed the headline and lead, keep the full text in the payload, and the dense vector stays about one story.

The [filter](/documentation/search/filtering/) goes inside each `Prefetch`, so both retrievers search only the valid subset.

```python
QUERY = "port congestion in Southeast Asia"

news_filter = models.Filter(
    must=[
        models.FieldCondition(key="country", match=models.MatchValue(value="VN")),
        models.FieldCondition(
            key="published_at",
            # a fixed date keeps the example reproducible;
            # in production this is now() minus seven days
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

for point in results.points:
    print(f"{point.score:.4f}  {point.payload['headline']}")
```

Both prefetches carry the same filter, so every article that comes back satisfies it. The Singapore story is not a near miss that got demoted; it never entered a candidate list.

### Question 5: What Are the Deployment Constraints?

*Latency budget, data residency, cost, and who operates this?*

The brief gives a small engineering team, no data-residency restrictions, and no appetite for nighttime pages. That points at managed deployment. The same design runs self-hosted if the constraints differ, so treat design and deployment mode as independent decisions.

### Try It: Why Hybrid, Not Dense Alone

Three articles are too few to show a margin, so the notebook carries nine. It runs `MAERSK-B.CO delisting` against them, two differing only in the ticker. Dense puts the right one first but scores it 0.7998 against the decoy's 0.6485, a gap of 0.151. BM25 scores the same pair 11.7550 and 2.3025, a gap of 9.45, and it returns only those two articles because nothing else in the collection shares a term with the query. On nine articles that thin dense margin still lands the right answer; on nine million it is noise.

Then run `vessels queuing outside harbours in Vietnam`, which shares no word with the article it should find. Dense ranks that article first at 0.7093. BM25 returns a single result and it is the wrong one, matching "Vietnam" in an unrelated export story. On the ticker query, sparse rescues dense. On this one, dense rescues sparse.

### The Design on One Page

The five answers, with the layer each one commits you to. Deployment mode is the one decision that is not a layer at all, which is why the design survives changing it.

| Question | Answer for this system | Layer |
|----------|------------------------|-------|
| Query type | Mixed semantic and exact, so hybrid with RRF | Query |
| Filter scope | country, topic, source, date, indexed before ingestion | Knowledge, indexing |
| Workload shape | Millions of articles: bulk backfill, then continuous ingestion | Indexing, knowledge |
| Pipeline | Hybrid with per-prefetch filters; headline and lead embedded; no reranker yet | Query, knowledge |
| Deployment | Managed; design independent of the choice | Not a layer |

## 3. How Qdrant Plans a Filtered Query

Module 3 covered how to write a filter and where to put it in a hybrid query. What's new is what Qdrant does with one.

Post-filtering retrieves a fixed number of nearest results, the top-K, then discards whatever fails the filter. A selective filter matches only a small share of the collection, one country out of 200 say. Against that, even a large K can come back empty.

Qdrant runs a [query planner](/documentation/search/search/#query-planning) instead. It starts by estimating **cardinality**, how many points the filter will match, because that number decides everything after it.

Then it picks a strategy for each **[segment](/documentation/manage-data/storage/)**, the independent pieces a collection is stored in. Three strategies cover most queries:

- A segment holding few points gets scanned outright.
- A low-cardinality filter goes through the payload index, which is cheaper than the graph at that selectivity.
- A high-cardinality one goes through the filterable HNSW index built in Question 2.

Every threshold in these decisions is configurable per collection.

The estimate comes from the payload index, so an unindexed field leaves the planner guessing and the query slow rather than wrong. Slow rather than wrong is how a missing index sits in production unnoticed for months.

## 4. The Production RAG Pipeline

**Retrieval-Augmented Generation (RAG)** answers a question from your own data: retrieve the relevant chunks, hand them to a large language model as context, and it answers from what you gave it, not from training. [What is RAG](/articles/what-is-rag-in-ai/) covers the pattern in depth.

Give the news system that feature and the pipeline has four steps:

1. **Query understanding**: pull hard constraints (dates, country, topic) into a filter, and embed the query as a dense and a sparse vector. The unit changes here: search returned whole articles, but generation needs passages short enough to fit a prompt, so bodies are split into chunks and each chunk becomes its own point. Those chunks live in a second collection, not in the one built above.
2. **Hybrid retrieval**: one `query_points` call, filtered on each prefetch, fused with `RrfQuery`, keeping the top 20 chunks.
3. **Optional reranking**: a second scoring pass over that short list. A cross-encoder reads the query and the chunk together, which is more accurate than comparing two embeddings that were computed separately. It is also far too slow to run over a whole collection, so it reorders the 20 and keeps five. Add it when the right chunk keeps landing at position eight when it should be at two. [Reranking in Semantic Search](/documentation/search-precision/reranking-semantic-search/) compares the types and their cost.
4. **Generation**: the top chunks go in as context and the model writes the answer.

### Rule of Thumb

When RAG quality disappoints, improve step 2 before reaching for a bigger model in step 4. Retrieval sets the ceiling: the model cannot cite a chunk it never received.

## 5. Deployment Options

Question 5 picked managed deployment for the news system. There are six deployment options, and the design runs unchanged on every one, so the choice comes down to two questions: how much of the operating do you want to do, and how isolated does the data have to be. Those pull in the same direction, which is why five of the modes line up on one spectrum from least setup to most control. Edge sits outside it.

![Six Qdrant deployment modes on a spectrum from least setup to most control: Local Mode, Managed Cloud, Hybrid Cloud, self-hosted Docker, and Private Cloud or on-prem, each with when to use it and when to avoid it, with Edge shown separately as a single-node on-device special case.](/courses/beginners/module-4/deployment.png)

Where to read more on each: [Local Mode](/documentation/quickstart/), [Managed Cloud](/documentation/cloud/), [Hybrid Cloud](/documentation/hybrid-cloud/), [Docker](/documentation/installation/#production) for self-hosting, [Private Cloud](/documentation/private-cloud/) for any Kubernetes cluster, and [Edge](/documentation/edge/). [Deploy Qdrant](/documentation/deploy-intro/) compares them in one place.

One caveat about Local Mode, since it is the quickest way to try a snippet. It reimplements the API in Python with none of the engine behind it: search is exact instead of approximate, payload indexes have no effect, and a filter on the outer query is ignored. Every example in this course runs against a Qdrant Cloud cluster for that reason, and any number Local Mode gives you needs checking against a real server.

## 6. Knowledge Check

A new brief, not the one you just designed:

> A SaaS company wants to search its own support tickets. Agents describe a problem in their own words ("customer can't log in after SSO change") and often paste an error code such as `AUTH-5521`. Every search must be scoped to the agent's own product line, and to tickets from the last two years. There are four million tickets, arriving a few thousand a day.

Work through the five questions before opening the answers.

<details>
<summary>Question 1: What Do the Queries Look Like?</summary>

Both kinds, as in the news system. The description is semantic; the error code is an exact token a dense model will blur into neighboring codes. So: hybrid, fused with RRF. (Query layer.)

</details>

<details>
<summary>Question 2: What Must the System Filter On?</summary>

Product line as a keyword index and ticket date as a datetime index, both created before ingestion. Anything an agent must never see across product lines is a filter, not a ranking signal.

</details>

<details>
<summary>Question 3: What's the Workload Shape?</summary>

A bulk backfill of four million text tickets, then light continuous ingestion. One collection, upserts, no distribution-layer work on day one.

</details>

<details>
<summary>Question 4: What Does the Retrieval Pipeline Look Like?</summary>

Hybrid retrieval with the filter inside each prefetch. The knowledge-layer decision is what to embed: a ticket thread runs long, so embed the subject and the first message and keep the full thread in the payload. Add a reranker only if evaluation shows the right ticket landing below the fold.

</details>

<details>
<summary>Question 5: What Are the Deployment Constraints?</summary>

Not stated in the brief, which is the point. Ask before you choose. Support tickets carry customer data, so the answer usually turns on where that data is allowed to live, not on latency or cost.

</details>

## 7. References and Further Reading

- [Capacity Planning](/documentation/capacity-planning/): how to size RAM and disk for vectors, payloads, and indexes before you commit to a node.
- [Production Checklist](/documentation/production-checklist/): what to have in place before launch, from replication to observability.
- [Qdrant Cloud](https://cloud.qdrant.io/): create a free cluster before Module 5, so the capstone runs against a real server.

## What's Next: Module 5

The capstone runs the same five questions against bigger answers. Three modalities replace one: news, audio, and satellite imagery, each embedded into named vectors on shared points. Those signals get clustered into risk themes, and the queries cross languages, so an English question retrieves Japanese and Chinese sources.
