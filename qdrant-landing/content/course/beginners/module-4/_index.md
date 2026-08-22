---
title: "Module 4: Designing a Vector Search System"
short_description: "Module 4 of the Beginners course: the decisions that turn a small collection into a system holding millions of points."
description: "Design a vector search system in Qdrant: what to decide before ingesting, what changes as data grows, where generation fits, and where to run it."
isLesson: true
weight: 50
---

{{< date >}} Module 4 {{< /date >}}

# Designing a Vector Search System

<div class="video">
  <iframe src="https://www.youtube.com/embed/0qQ3B9uirz0?rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
  </iframe>
</div>

So far, rebuilding a collection has taken only a few seconds. Once generating embeddings takes hours, you need to get the design right before ingesting your data.

**Follow-along code**: [Module 4 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb)

#### Overview

> Module 3 showed you how to combine dense and sparse retrieval. Now you'll use those pieces to design a system that can grow beyond a small collection. You'll decide what to store and embed, see what changes as the collection grows, and choose when to add more machines, when to put a language model on top, and where to run Qdrant. By the end, you'll have designed a news search system and five questions to use on a system of your own.

## Today's Path

1. Where Design Decisions Live
2. Decide Before You Ingest
3. What Changes as the Collection Grows
4. Growing Past One Machine
5. From Results to an Answer (Optional)
6. Where It Runs
7. Design Your Own System
8. References & Further Reading

## 1. Where Design Decisions Live

A vector search system has five layers. The first four go from easiest to hardest to change. Distribution is separate, because its cost depends on which change you make, and Section 4 covers it.

![The five layers of a vector search system as stacked rows. Four sit on a shaded scale from easiest to hardest to change: Query, holding query embedding, dense and sparse search, fusion, and top-K; Indexing, holding the HNSW graph and payload indexes; Storage, holding quantization and on-disk storage; and Data, holding chunking, the embedding model, and the payload schema. Distribution, holding sharding and replication, sits below in a dashed group because what a change costs there depends on the operation.](/courses/beginners/module-4/layers.png)

**Query** handles each request: embed the query, search dense vectors, sparse vectors, or both, then combine the ranked lists into the top-K results. Module 3 covered this layer. If the query is wrong, change it and run it again. The [Query API](/documentation/search/search/) covers every form a query can take.

**Indexing** contains the structures that make search fast. Qdrant builds two of them: the HNSW graph over your vectors, from Module 2, and a payload index over each field you filter on. A mistake here leaves the results correct and makes them slow, and rebuilding the index fixes it. [Indexing](/documentation/manage-data/indexing/) covers how to configure both.

**Storage** controls whether points live in memory or on disk, and therefore how much memory you need. The two main levers are [quantization](/documentation/manage-data/quantization/), which compresses each vector into fewer bytes, and [on-disk vectors](/documentation/manage-data/storage/#configuring-memmap-storage), which keep them in files instead. Both are collection configuration changes, and on an existing collection both rewrite every vector.

**Data** includes the content and the decisions made before it reaches Qdrant. No layer above can fix a mistake here, so the only fix is ingesting the data again. Section 2 works through all four: the text you embed, the model that embeds it, the chunk size, and the payload fields. [Vectors](/documentation/manage-data/vectors/) and [Payload](/documentation/manage-data/payload/) cover what a point can hold.

**Distribution** spreads a collection across more than one machine, through sharding and replication. Section 4 covers this layer, and [Distributed Deployment](/documentation/distributed_deployment/) has the mechanics.

## 2. Decide Before You Ingest

Four decisions belong to the data layer. Changing any one means ingesting the data again. Here's a news search example:

> Analysts at a research firm search global news as it arrives. They ask questions in plain language, such as "port congestion in Southeast Asia." They scope every search by country, topic, date, and source. About one query in five names something specific, such as a stock symbol or a ship name.

**What text gets embedded.** One vector represents one piece of text. A longer piece of text averages more meanings into one vector. A headline and its opening paragraph describe one story. The full body adds background. Embed the headline and opening paragraph, and keep the body in the payload.

**Which model embeds it.** The model determines the vector size and distance metric. This example uses `all-MiniLM-L6-v2` from Module 1, which produces 384-dimensional vectors. It also needs a sparse model. A dense vector can treat an exact string such as `MAERSK-B.CO` as part of the general shipping topic. Sparse vectors preserve exact terms.

**How long each piece is.** Module 2 covered chunking. A headline and an opening paragraph fit inside this model's 256-token limit, so nothing here needs splitting. Long PDFs and support threads would need to be split into chunks.

**Which payload fields exist.** You cannot filter on a field you never stored. Ask which fields every search has to filter on. For this brief, that is country, topic, source, and date.

Together, these decisions define the payload schema. Sketch it in YAML before the code creates the collection:

```yaml
payload:
  country: string         # indexed
  topic: string           # indexed
  source: string          # indexed
  published_at: datetime  # indexed
  headline: string        # embedded and returned
  lead: string            # embedded and returned
  body: string            # returned only, never embedded
```

### Build in This Order

Create the collection, create its payload indexes, then ingest the points. When Qdrant builds the HNSW graph, it adds extra edges for fields that already have payload indexes, making filtered search faster. An index added later still filters correctly, but Qdrant must [rebuild the HNSW graph](/documentation/manage-data/indexing/#rebuild-the-hnsw-index) before adding those edges.

```bash
pip install "qdrant-client[fastembed]"
```

`models.Document` embeds text on your own machine through [FastEmbed](/documentation/fastembed/). [Cloud Inference](/documentation/inference/cloud-inference/) does the same work on the server. Use it when you want Qdrant to handle embedding in production. Module 0 walks you through creating the free cluster this code connects to and finding its URL and API key.

```python
from qdrant_client import QdrantClient, models

# from Module 1, produces 384-dimensional vectors
DENSE_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# from Module 3
SPARSE_MODEL = "Qdrant/bm25"

client = QdrantClient(
    # your cluster URL, from Module 0
    url="https://xyz-example.eu-west-1-0.aws.cloud.qdrant.io",
    # your cluster API key, from Module 0
    api_key="<your-api-key>",
)

client.create_collection(
    collection_name="news",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        # BM25 weighs a term by how rare it is across the collection.
        # The IDF modifier is what makes Qdrant do that counting.
        "sparse": models.SparseVectorParams(modifier=models.Modifier.IDF),
    },
)

for field in ["country", "topic", "source"]:
    client.create_payload_index(
        collection_name="news",
        field_name=field,
        # KEYWORD is the index type for a string field you match exactly
        field_schema=models.PayloadSchemaType.KEYWORD,
    )

client.create_payload_index(
    collection_name="news",
    field_name="published_at",
    # dates get their own index type, and DatetimeRange filters on them
    field_schema=models.PayloadSchemaType.DATETIME,
)
```

Now load the articles. Embed the headline and lead, and store the full article in the payload:

```python
ARTICLES = [
    {
        "country": "VN", "topic": "shipping", "source": "reuters",
        "published_at": "2026-07-15T08:00:00Z",
        "headline": "Port congestion worsens at Ho Chi Minh City terminals",
        "lead": "Waiting times at the city's two main berths have roughly"
                " tripled since June, and carriers are diverting boxes.",
        # a real body runs several hundred words; shortened here
        "body": "The backlog began with a monsoon shutdown.",
    },
    {
        "country": "VN", "topic": "shipping", "source": "nikkei",
        "published_at": "2026-07-18T08:00:00Z",
        "headline": "MAERSK-B.CO delisting rumor denied by carrier",
        "lead": "The carrier called weekend reports of a Copenhagen"
                " delisting unfounded, with no board discussion held.",
        "body": "Shares closed flat on Friday ahead of the statement.",
    },
    {
        "country": "SG", "topic": "shipping", "source": "caixin",
        "published_at": "2026-07-20T08:00:00Z",
        "headline": "Singapore berth waiting times fall for a third week",
        "lead": "Average waits at Tuas dropped below 12 hours, easing a"
                " backlog that built through the second quarter.",
        "body": "The port authority credited two new berths.",
    },
]

points = []
for i, article in enumerate(ARTICLES):
    # this is the text that becomes a vector: headline and lead, never the body
    embedded = f"{article['headline']}. {article['lead']}"
    points.append(
        models.PointStruct(
            id=i,
            # the same text goes to both models, so one point carries a dense
            # vector for meaning and a sparse vector for exact terms
            vector={
                "dense": models.Document(text=embedded, model=DENSE_MODEL),
                "sparse": models.Document(text=embedded, model=SPARSE_MODEL),
            },
            # the full article is stored, body included, and can be filtered
            payload=article,
        )
    )

client.upsert(collection_name="news", points=points)
```

### Querying the News Collection

The filter is built from the payload fields in the schema above, and it goes inside each `Prefetch`, the same placement Module 3 used.

```python
QUERY = "port congestion in Southeast Asia"

news_filter = models.Filter(
    must=[
        models.FieldCondition(key="country", match=models.MatchValue(value="VN")),
        models.FieldCondition(
            key="published_at",
            # a fixed date keeps this example reproducible;
            # real code computes the cutoff from the current date
            range=models.DatetimeRange(gte="2026-07-01T00:00:00Z"),
        ),
    ]
)

results = client.query_points(
    collection_name="news",
    prefetch=[
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

# Expected output:
#   1.0000  Port congestion worsens at Ho Chi Minh City terminals
#   0.3333  MAERSK-B.CO delisting rumor denied by carrier
```

Each prefetch returns 50 candidates for fusion, while the query returns 10 results. Both prefetches search only Vietnamese articles from July. The Singapore article is excluded.

### Try It Yourself

You embedded the headline and lead, and left the body out. Test that decision yourself. Build a second collection over the same three articles, with the body embedded too, then run one dense query against both and compare. Predict which way the scores move before you run it.

```python
client.create_collection(
    collection_name="news_with_body",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
)

points = []
for i, article in enumerate(ARTICLES):
    # the only change from the loop above: the body is embedded too
    embedded = f"{article['headline']}. {article['lead']} {article['body']}"
    points.append(
        models.PointStruct(
            id=i,
            vector={"dense": models.Document(text=embedded, model=DENSE_MODEL)},
            payload=article,
        )
    )

client.upsert(collection_name="news_with_body", points=points)

for name in ["news", "news_with_body"]:
    hits = client.query_points(
        collection_name=name,
        query=models.Document(text=QUERY, model=DENSE_MODEL),
        using="dense",
        limit=2,
    ).points
    print(f"{name}  gap {hits[0].score - hits[1].score:.4f}")
    for hit in hits:
        print(f"   {hit.score:.4f}  {hit.payload['headline']}")

# Expected output:
#   news  gap 0.2655
#      0.6538  Port congestion worsens at Ho Chi Minh City terminals
#      0.3883  Singapore berth waiting times fall for a third week
#   news_with_body  gap 0.1901
#      0.6457  Port congestion worsens at Ho Chi Minh City terminals
#      0.4556  Singapore berth waiting times fall for a third week
```

**What to look for:**

- The right article stays first either way, so nothing looks broken.
- The gap between the two closes. The Singapore story is a different event, about congestion easing rather than worsening, and it climbs from 0.3883 to 0.4556.
- Both scores move toward each other because every body describes ports, waiting times, and carriers. The vectors stop telling the two stories apart.

These bodies are a single sentence each. The notebook repeats the test with full-length articles, where the gap collapses much further. With three articles the right answer still comes first. With millions of articles, the smaller gap produces more loosely related results.

## 3. What Changes as the Collection Grows

This three-article collection needs no tuning. At millions of points, both the indexing and storage layers need attention.

### Index Time Against Search Quality

Module 2 introduced `m` and `ef_construct`, which control how much work goes into building the HNSW graph. Higher values make the graph more accurate, but they also make indexing slower and use more memory. The defaults suit most collections. See [Optimize Performance](/documentation/ops-optimization/optimize/) when you have measured a gap you need to close.

### Memory Usage

Qdrant keeps every vector in memory by default, which is fast and expensive. Quantization is the lever to try first, because it cuts memory for a small loss of precision that you can measure. On-disk vectors go further and trade latency for capacity, which fits a collection much larger than the memory you want to pay for.

### Indexing Lag

Points become searchable as soon as they are stored. The HNSW graph may finish indexing them later. `get_collection` reports both numbers, and their difference is the backlog:

```python
info = client.get_collection("news")
print(info.points_count, info.indexed_vectors_count)

# Expected output:
#   3 3
```

On a collection this small, the two numbers match. For the first big upload, use the batching approach in [Bulk Upload](/documentation/manage-data/bulk-upload/), then watch both counts as it runs. If the gap keeps growing, points are arriving faster than Qdrant's optimizer can index them. See [Optimizer](/documentation/ops-optimization/optimizer/) for what to do next.

## 4. Growing Past One Machine

Most systems never need more than one node. **Sharding** splits a collection's points across nodes, so each node holds a slice. **Replication** keeps a copy of each shard on more than one node, so search survives losing one.

Use them when one node cannot hold the collection, or when search must continue after a node fails. The two differ in what they cost to add: a replica is usually a live change, while resharding an existing collection moves data. If search is slow, measure and tune the index before adding nodes. Adding nodes costs more, and it will not make an unindexed filter faster. [Distributed Deployment](/documentation/distributed_deployment/) covers both.

## 5. From Results to an Answer (Optional)

Everything so far returns a ranked list. **Retrieval-Augmented Generation (RAG)** sends that list to a language model, which writes an answer from the retrieved results. Generation sits outside the search system.

![Three steps left to right, each with what it does and an example of its output. Understand extracts intent and rewrites the query, producing "port congestion delays in Vietnam this month". Retrieve, inside a box marked Qdrant, runs a hybrid query with a filter and returns the top 10 results, the first two being articles on Ho Chi Minh City port congestion and Singapore berth waiting times. Generate, outside that box, puts those results in a prompt and the model answers, beginning "Waiting times at the city's two main berths have".](/courses/beginners/module-4/rag.png)

The simplest version embeds the question and searches with it, which makes the second step the query you already built in Section 2. When the question needs work first, a language model can rewrite it into better search terms, or lift a constraint such as a date range out of it and into a filter.

With RAG, you may retrieve chunks instead of whole articles. Split each article into chunks and store each chunk as its own point. That is the chunking decision from Section 2, so make it before you ingest.

If the answer is weak, look at retrieval before reaching for a bigger model. A bigger model cannot use a result that retrieval never returned.

Frameworks such as LangChain and LlamaIndex connect retrieval to generation. [Frameworks](/documentation/frameworks/) lists the ones with a Qdrant integration.

## 6. Where It Runs

Deployment mode is independent of the decisions above. Choose based on how much you want to run yourself and how isolated the data needs to be. Four modes run Qdrant as a server:

- **Managed Cloud** runs it for you, with upgrades, backups, and replication handled.
- **[Hybrid Cloud](/documentation/hybrid-cloud/)** runs in your own Kubernetes cluster, managed from the Qdrant Cloud console, with the data staying in your network.
- **[Private Cloud](/documentation/private-cloud/)** runs in your own Kubernetes cluster with no connection to that console, and can run fully air-gapped.
- **Docker** means you run and operate the container, on your own machine or your own infrastructure.

Both Kubernetes modes require you to operate a cluster, so choose one only when a data requirement rules out Managed Cloud.

Two more run inside a process instead of as a server. Local mode runs inside your Python program for notebooks and tests. Edge embeds one self-contained shard inside an application on a device, the way SQLite embeds a database. Use it for offline or very low-latency search. [Deploy Qdrant](/documentation/deploy-intro/) links the setup guide for each mode.

![Six Qdrant deployment modes. Four run as a server, shaded from light to dark by how much you operate them: Managed Cloud, Hybrid Cloud, Private Cloud, and Docker. Local mode and Edge are grouped separately because they run inside a process instead.](/courses/beginners/module-4/deployment.png)

## 7. Design Your Own System

Use these five questions to design a system of your own:

1. **What do the queries look like?** Plain language, exact strings such as codes and IDs, or both. If you need both, use hybrid search, from Module 3.
2. **Which fields must every search filter on?** That list is your payload schema, and each field on it needs an index.
3. **What is the unit you retrieve?** A whole document, one chunk of it, or an image. That answer tells you what to embed.
4. **How much data will arrive, and at what rate?** This decides how you run the first bulk load, and whether indexing keeps up afterward.
5. **Where is the data allowed to live?** This decides the deployment mode.

Four common system types and their main design decision.

| System | What its design turns on | Where it is built |
|--------|--------------------------|-------------------|
| News or document search | The payload schema, because every query is scoped | This module |
| Code or catalog search | Sparse retrieval, because queries are exact strings | Module 3 |
| Image, audio, or video search | Named vectors carrying one modality each | Module 5 |
| Long-document retrieval | Chunking, ahead of every other decision | [Chunking Strategies](/course/essentials/day-1/chunking-strategies/) |

### Try It Yourself: Design Your Own

Use a new brief. Answer the five questions before opening the answers.

> A law firm wants to search 60,000 scanned contracts, each 20 to 80 pages long. Lawyers ask in plain language, such as "does this lease allow subletting", and every search must be scoped to the client the contract belongs to. A few dozen contracts arrive after each deal closes.

<details>
<summary>What do the queries look like?</summary>

The example queries are in plain language, so start with dense retrieval. Add sparse retrieval if lawyers also search for clause numbers, citations, or exact phrases.

</details>

<details>
<summary>Which fields must every search filter on?</summary>

The client. Filter every query on a client field, and create a keyword payload index on it before you ingest so that filter stays fast.

</details>

<details>
<summary>What is the unit you retrieve?</summary>

A section of a contract. One vector over 80 pages blurs every clause together, so split each contract into chunks and store each chunk as its own point, carrying the contract ID in its payload.

</details>

<details>
<summary>How much data will arrive, and at what rate?</summary>

One backfill of 60,000 contracts, then small ongoing batches. How many points that becomes depends on your chunk size, so batch the load and watch the indexing gap.

</details>

<details>
<summary>Where is the data allowed to live?</summary>

The brief does not say, so ask. Contract data often carries residency or confidentiality requirements, and those decide the deployment mode.

</details>

## 8. References & Further Reading

- [Sizing Tool](https://sizing.qdrant.tech) How much memory and disk a collection needs, before you commit to a node.
- [What Is RAG](/articles/what-is-rag-in-ai/) The retrieval and generation pattern in depth.
- [Qdrant Cloud](https://cloud.qdrant.io/) Create a free cluster before Module 5, so the capstone runs against a real server.

## What's Next: Module 5

A factory fire at a supplier's plant reaches you as a local news report, a satellite image, an earnings call, and a filing weeks later. None of them arrives labeled as an incident, so Module 5 builds one collection that connects the signals describing the same event. You will search for "smoke above factory roof" to find the image, then extend the system so an English query reaches sources published in Japanese, Mandarin, Korean, or Vietnamese.
