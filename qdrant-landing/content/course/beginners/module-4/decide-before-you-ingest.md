---
title: "Decide Before You Ingest"
short_description: "Module 4 of the Beginner Course: the four data-layer decisions you cannot undo without re-ingesting."
description: "Four decisions belong to the data layer: what you embed, the model, the chunk size, and the payload schema. Changing any one means ingesting again."
weight: 3
isLesson: true
---

{{< date >}} Module 4 {{< /date >}}

# Decide Before You Ingest

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
