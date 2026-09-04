---
title: "Module 5: Multimodal Supplier Risk Intelligence"
short_description: "Module 5 of the Beginners course: the capstone project. Ingest, cluster, and query multimodal supplier signals in one collection."
description: "Build the Beginners capstone: ingest news, transcripts, and satellite imagery on shared points, cluster them into risk themes, and query every modality."
isLesson: true
weight: 60
---

{{< date >}} Module 5 {{< /date >}}

# Multimodal Supplier Risk Intelligence

<div class="video">
  <iframe src="https://www.youtube.com/embed/Cvl38vKHiWs?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
  </iframe>
</div>

Apply every concept from Modules 1 through 4 in a single end-to-end system: ingest daily news, transcripts, and satellite imagery about your suppliers, cluster them into risk themes, and query all of it from one collection.

**Follow-along code**: [Module 5 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module5.ipynb)

#### Overview

> Module 4 turned the building blocks into a design. In this module, you'll build that design into a working system. You'll explore named vectors that hold text and image evidence on a single point, then see how clustering groups those signals into the events they describe. You'll also learn how to search images with text and extend the system across languages. By the end, you'll have ingested, clustered, and queried multimodal signals from one collection.

## Today's Path

1. Project Overview
2. System Architecture
3. Signal Sources and Embedding Models
4. Ingestion Pipeline
5. Clustering Risk Signals
6. Analyst Queries
7. Knowledge Check
8. Course Summary
9. References & Further Reading

## 1. Project Overview

A factory fire at a supplier's plant reaches you four ways. A local news report, a satellite image, an earnings call where an executive gets asked about it, and the supplier's own filing weeks later. You are building the system an analyst uses to see all four, and none of them arrives labeled as an incident.

This is the news search system you designed in Module 4, extended in three ways:

- **Multiple modalities**: news, satellite imagery, and transcribed audio, all in one collection.
- **Daily ingestion**: signals arrive every 24 hours rather than as a one-off load.
- **Clustering**: group signals that describe the same underlying event, even when they arrive from different sources and in different formats.

Module 4's five design questions still frame the work. Only the answers get bigger.

## 2. System Architecture

The system has four stages. Each maps to Qdrant primitives you already know.

1. **Ingest**: collect the day's signals from news APIs, image feeds, and transcript files. Chunk anything longer than a paragraph.
2. **Embed**: hand each part of a signal to the model for its modality, producing named vectors: `text_dense`, `text_sparse`, `image`.
3. **Store**: upsert each signal as one `PointStruct` carrying every vector it has, plus a payload: supplier, source type, country, publication date, risk score.
4. **Cluster and Query**: a daily batch tags signals with a `cluster_id`; on demand, analysts run hybrid and image queries against the same collection.

![The four capstone stages stacked top to bottom: ingest, embed, store, then cluster and query, each labeled with the Qdrant primitive it maps to.](/courses/beginners/module-5/four-stage.png)

### Collection Schema

One collection holds every modality. Named vectors let you query by text or by image from the same point. Every field an analyst filters on is indexed, exactly as you designed in Module 4.

```yaml
collection: supplier_signals

named_vectors:
  text_dense:  { model: all-MiniLM-L6-v2, size: 384, distance: Cosine }
  text_sparse: { model: Qdrant/bm25, modifier: IDF }
  image:       { model: Qdrant/clip-ViT-B-32-vision, size: 512, distance: Cosine }

payload_fields:
  supplier_id:  { type: keyword,  indexed: true }
  source_type:  { type: keyword,  indexed: true, values: [news, satellite, audio, filing, social] }
  language:     { type: keyword,  indexed: true }
  country:      { type: keyword,  indexed: true }
  facility_id:  { type: keyword,  indexed: true }
  published_at: { type: datetime, indexed: true }
  risk_score:   { type: float,    indexed: true, range: "0.0 to 1.0" }
  cluster_id:   { type: integer,  indexed: true, note: assigned after ingestion }
  summary:      { type: text,     indexed: false, note: short excerpt or caption }
```

Three named vectors, not five. A transcript is text once it has been transcribed, and a video frame is an image once it has been sampled, so neither needs a space of its own. Section 3 comes back to that.

## 3. Signal Sources and Embedding Models

Two models cover every signal here, and both run through FastEmbed exactly as in Modules 3 and 4: name the model, pass the content, and the client embeds it locally before upload.

| Signal source | Modality | Embedding model | Vectors it produces |
|---------------|----------|-----------------|---------------------|
| News articles | text | all-MiniLM-L6-v2 and Qdrant/bm25 | `text_dense`, `text_sparse` |
| Financial filings | text | all-MiniLM-L6-v2 and Qdrant/bm25 | `text_dense`, `text_sparse` |
| Earnings-call transcripts | text, transcribed | all-MiniLM-L6-v2 and Qdrant/bm25 | `text_dense`, `text_sparse` |
| Satellite imagery | image and caption | clip-ViT-B-32-vision, and the two text models on the caption | `image`, `text_dense`, `text_sparse` |

Satellite captures are the row worth reading twice. The caption is what gives an image its text vectors, and Section 5 depends on those: an uncaptioned image can never join a text cluster.

Everything in this module installs with one line:

```bash
pip install "qdrant-client[fastembed]" scikit-learn numpy
```

### Text: Dense and Sparse

News articles, filings, and transcripts each get two text vectors, a dense one for meaning and a sparse one for exact tokens: the hybrid pairing from Module 3, using the same two models that module used.

```python
from qdrant_client import QdrantClient, models

DENSE_MODEL  = "sentence-transformers/all-MiniLM-L6-v2"   # Module 3's model, 384 dimensions
SPARSE_MODEL = "Qdrant/bm25"

# CLIP is a pair of encoders sharing one space: images go through the vision
# side, and a text query searching those images goes through the text side.
IMAGE_MODEL      = "Qdrant/clip-ViT-B-32-vision"
IMAGE_TEXT_MODEL = "Qdrant/clip-ViT-B-32-text"
```

`all-MiniLM-L6-v2` reads at most 256 tokens and silently drops the rest, so anything longer than a few paragraphs is chunked first. Roughly 150 words fits inside that budget with room to spare:

```python
def chunk_text(text: str, size: int = 150, overlap: int = 30) -> list[str]:
    """
    Fixed-size word windows with overlap, the Module 2 strategy.
    150 words stays under all-MiniLM-L6-v2's 256-token limit; the overlap keeps
    a sentence split across two chunks readable in both.
    """
    words = text.split()
    if len(words) <= size:
        return [text]
    step = size - overlap
    return [" ".join(words[i:i + size]) for i in range(0, len(words), step)]
```

### Images: CLIP Through FastEmbed

Satellite imagery of supplier facilities is embedded with CLIP (Contrastive Language-Image Pre-training). CLIP is trained on image and caption pairs, which puts pictures and text in one shared vector space, and that shared space is what makes a text query like "smoke above factory" match a satellite photo with no caption attached.

FastEmbed exposes the two halves as two model names, so there is no separate image library to install and no tensors to handle:

```python
# At ingestion: the picture itself becomes the `image` vector.
satellite_input = models.Image(
    image="captures/haiphong-2026-07-15.jpg",
    model=IMAGE_MODEL,
)

# At query time: the search phrase has to be embedded by CLIP's *text* encoder
# so it lands in the same space. CLIP truncates text at 77 tokens, so keep
# image queries to a phrase rather than a paragraph.
image_query = models.Document(
    text="smoke above factory roof",
    model=IMAGE_TEXT_MODEL,
)
```

Neither of those holds numbers yet. `models.Image` and `models.Document` record what to embed and which model to use, and the client turns them into vectors when you hand them to `upsert` or `query_points`.

Using `DENSE_MODEL` for that second call is the mistake to avoid. It produces a perfectly good 384-dimensional vector in the wrong space, and the query either errors on dimension or returns noise.

### The Same Pattern Extends to Audio and Video

Nothing above is specific to articles and satellite tiles. An earnings call becomes text once it is transcribed, and video becomes images once frames are sampled, and both then take a path this module already covers: a transcript is chunked and handed to `models.Document` like an article, a frame is handed to `models.Image` like a satellite tile. That is why the collection declares three named vectors rather than five.

Transcription itself is outside the course. Whisper is the usual choice, and it needs the `ffmpeg` command-line tool installed alongside the Python package, so the transcripts here arrive as plain strings instead of an audio pipeline:

```python
# Two excerpts from a quarterly call, already transcribed. Swap in Whisper
# output when you have ffmpeg on the machine; the ingestion path is identical.
EARNINGS_CALL_EXCERPTS = [
    "On the Haiphong question: the line was halted for four days after the fire "
    "and two of the three shifts are running again as of this week.",
    "We are not guiding to a shortage. The backlog at the port adds a week to "
    "inbound components and we have qualified a second supplier for the housing.",
]
```

## 4. Ingestion Pipeline

The daily job collects signals, embeds each modality, and upserts them. A risk scoring step assigns an initial `risk_score`, which analysts later filter on.

Risk scoring is a keyword baseline, deliberately simple, and the first thing to replace once you have labeled signals of your own:

```python
import re

# Highest-weighted term wins, so one mention of "fire" outranks three of "delay".
RISK_TERMS = {
    "fire": 0.9, "explosion": 0.9, "halted": 0.8, "shutdown": 0.8,
    "recall": 0.7, "strike": 0.7, "flood": 0.7,
    "investigation": 0.5, "shortage": 0.5, "delay": 0.5,
    "backlog": 0.4, "inspection": 0.4,
}

def score_risk(text: str) -> float:
    """A baseline to beat, not a model. Returns 0.0 when nothing matches."""
    lowered = text.lower()
    return max(
        (weight for term, weight in RISK_TERMS.items()
         # \b stops "fire" matching "firearm" and "strike" matching "striking"
         if re.search(rf"\b{term}\b", lowered)),
        default=0.0,
    )
```

### Collection Setup

```python
import uuid
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="YOUR_API_KEY",
)

client.create_collection(
    collection_name="supplier_signals",
    vectors_config={
        "text_dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
        "image":      models.VectorParams(size=512, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "text_sparse": models.SparseVectorParams(
            modifier=models.Modifier.IDF  # required for BM25 scoring, as in Module 4
        ),
    },
)

# Every field an analyst filters on gets an index, and all of them are created
# before ingestion so the HNSW graph picks up its filter-aware edges (Module 4).
for field in ["supplier_id", "source_type", "language", "country", "facility_id"]:
    client.create_payload_index(
        collection_name="supplier_signals",
        field_name=field,
        field_schema=models.PayloadSchemaType.KEYWORD,
    )

client.create_payload_index(
    collection_name="supplier_signals",
    field_name="published_at",
    field_schema=models.PayloadSchemaType.DATETIME,
)
client.create_payload_index(
    collection_name="supplier_signals",
    field_name="risk_score",
    field_schema=models.PayloadSchemaType.FLOAT,
)
client.create_payload_index(
    collection_name="supplier_signals",
    field_name="cluster_id",     # values arrive after clustering, index now anyway
    field_schema=models.PayloadSchemaType.INTEGER,
)
```

`risk_score` and `cluster_id` are easy to forget here, because nothing filters on them until Sections 5 and 6. Skip them and the analyst query in Section 6 doesn't just run slowly: Qdrant Cloud enables strict mode by default, so a query filtering an unindexed field is rejected outright.

### One Signal, One Point

This is the decision the rest of the capstone rests on. A satellite image of a burning facility, the local news article about it, and the earnings call where it comes up are three signals, but an image and the caption written with it are **one** signal seen two ways. Put every vector describing the same thing on the same point:

```python
def ingest_signal(signal: dict) -> str:
    """
    Build one point carrying every vector this signal has.
    `text` covers article bodies, transcript chunks, and image captions alike.
    """
    vectors = {}

    if signal.get("text"):
        vectors["text_dense"]  = models.Document(text=signal["text"], model=DENSE_MODEL)
        vectors["text_sparse"] = models.Document(text=signal["text"], model=SPARSE_MODEL)

    if signal.get("image_path"):
        vectors["image"] = models.Image(image=signal["image_path"], model=IMAGE_MODEL)

    point_id = str(uuid.uuid4())
    client.upsert(
        collection_name="supplier_signals",
        points=[
            models.PointStruct(
                id=point_id,
                vector=vectors,
                payload={
                    "supplier_id":  signal["supplier_id"],
                    "source_type":  signal["source_type"],
                    "language":     signal.get("language", "en"),
                    "country":      signal.get("country"),
                    "facility_id":  signal.get("facility_id"),
                    "published_at": signal["published_at"],
                    "risk_score":   score_risk(signal.get("text", "")),
                    "summary":      signal.get("text", "")[:300],
                },
            )
        ],
    )
    return point_id
```

Nothing in that function calls an embedding library. `models.Document` and `models.Image` name a model and hand over the content, and the client embeds locally through FastEmbed before upload, the same mechanism Module 3 used for a shoe catalog.

Each source type is a thin wrapper over it:

```python
def ingest_news_article(article: dict):
    for chunk in chunk_text(article["text"]):
        ingest_signal({**article, "text": chunk})

def ingest_satellite_capture(capture: dict):
    # The caption matters more than it looks. An image with no text carries no
    # text_dense vector, so it can never join a text cluster in Section 5 and
    # never matches a text query. Caption it at ingestion, not later.
    ingest_signal({
        "text":         capture["caption"],
        "image_path":   capture["image_path"],
        "source_type":  "satellite",
        **{k: capture[k] for k in ("supplier_id", "facility_id", "country", "published_at")},
    })

def ingest_earnings_call(call: dict, excerpts: list[str]):
    for excerpt in excerpts:
        for chunk in chunk_text(excerpt):
            ingest_signal({**call, "text": chunk, "source_type": "audio"})
```

One quarterly call, ingested from the excerpts defined in Section 3:

```python
ingest_earnings_call(
    {
        "supplier_id":  "SUP-7291",
        "country":      "VN",
        "facility_id":  "FAC-HAIPHONG-1",
        "published_at": "2026-07-16T14:00:00Z",
    },
    EARNINGS_CALL_EXCERPTS,
)
```

Keep `source_type` values drawn from the fixed set in the collection schema. A filter written against a value nobody ingests returns nothing, and nothing warns you.

## 5. Clustering Risk Signals

Clustering groups signals that describe the same underlying event, even when they arrive from different sources. A factory fire appears in a local news article, a captioned satellite image, and an earnings call answer. Because Section 4 put a `text_dense` vector on all three, clustering can surface them as one event.

Qdrant uses the word for one other thing: a Qdrant Cloud cluster is the deployment that holds your collection. The clustering in this section runs in your own code, over the vectors already stored there.

This is the one part of the capstone that Modules 1 through 4 did not teach. Everything else here is a bigger version of something you have already built.

### The Clustering Approach

- **Cluster assignment**: retrieve the day's vectors with `scroll`, run a lightweight k-means (a standard algorithm that groups vectors around k center points) over them, and write a `cluster_id` back to each point.
- **Centroids**: a cluster's center point is itself a vector. Query with it to pull in older signals about the same theme.
- **Cross-supplier clustering**: run the same job with no `supplier_id` filter to find themes affecting many suppliers at once.

### Retrieving Signals for a Supplier

`scroll` returns one page at a time, so page until it hands back a null offset. A single capped call would silently cluster a busy supplier on partial data.

```python
import numpy as np
from datetime import datetime, timedelta, timezone

def get_supplier_signals_last_24h(supplier_id: str):
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    scroll_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="supplier_id", match=models.MatchValue(value=supplier_id),
            ),
            models.FieldCondition(
                key="published_at", range=models.DatetimeRange(gte=since),
            ),
        ]
    )

    points, offset = [], None
    while True:
        batch, offset = client.scroll(
            collection_name="supplier_signals",
            scroll_filter=scroll_filter,
            with_vectors=True,        # needed to compute centroids
            limit=256,
            offset=offset,
        )
        points.extend(batch)
        if offset is None:            # no further pages
            break
    return points

def dense_matrix(points):
    """text_dense vectors, with the point IDs they belong to."""
    ids, vecs = [], []
    for p in points:
        # A signal with no text at all, an uncaptioned image, has no text_dense
        # vector and drops out here. That is why Section 4 captions images.
        if p.vector and "text_dense" in p.vector:
            ids.append(p.id)
            vecs.append(p.vector["text_dense"])
    if not vecs:
        return [], None
    return ids, np.asarray(vecs, dtype=np.float32)
```

The collection stores `text_dense` with cosine distance, and Qdrant normalizes vectors on upload for cosine, so what comes back from `scroll` is already unit length. That matters for k-means, which measures Euclidean distance: on unit vectors, Euclidean distance and cosine distance rank pairs the same way, so no extra normalization step is needed here.

### Writing Cluster IDs Back to Payload

```python
from sklearn.cluster import KMeans

def cluster_and_tag(supplier_id: str, n_clusters: int = 5):
    points   = get_supplier_signals_last_24h(supplier_id)
    ids, arr = dense_matrix(points)

    if arr is None or len(ids) < n_clusters:
        return None  # not enough signals to cluster meaningfully

    model = KMeans(
        n_clusters=n_clusters,
        n_init=10,
        random_state=42,    # reproducible runs while you're learning
    ).fit(arr)

    # One call per cluster, not one per point
    for label in sorted(set(int(l) for l in model.labels_)):
        client.set_payload(
            collection_name="supplier_signals",
            payload={"cluster_id": label},
            points=[pid for pid, l in zip(ids, model.labels_) if int(l) == label],
        )
    return model.cluster_centers_
```

A fixed `n_clusters=5` is a placeholder, not a recommendation. The number of distinct risk themes in a day varies by supplier, so treat k as something to evaluate rather than a constant.

### Querying With a Centroid

A centroid is just a vector, so it can be a query. This is how you find older signals about a theme that only became visible today:

```python
def signals_like_cluster(centroid, limit: int = 20):
    return client.query_points(
        collection_name="supplier_signals",
        query=centroid.tolist(),
        using="text_dense",
        limit=limit,
        with_payload=True,
    )

centroids = cluster_and_tag("SUP-7291")
if centroids is not None:
    matches = signals_like_cluster(centroids[0])
```

A centroid is the mean of unit vectors, so it is not unit length itself. That costs you nothing here, because Qdrant normalizes query vectors on a cosine collection, and it can be passed straight in.

### Reading a Cluster Back

This is what indexing `cluster_id` bought you. One integer on each point turns a night of clustering into a view an analyst can page through:

```python
def signals_in_cluster(supplier_id: str, cluster_id: int):
    """Every signal the daily job put in one cluster."""
    points, _ = client.scroll(
        collection_name="supplier_signals",
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="supplier_id", match=models.MatchValue(value=supplier_id),
                ),
                models.FieldCondition(
                    key="cluster_id", match=models.MatchValue(value=cluster_id),
                ),
            ]
        ),
        limit=50,
    )
    return points
```

## 6. Analyst Queries

One collection, three named vectors. Two ways to ask here, plus the centroid query from Section 5.

### Searching Images With Text

The satellite signals are searchable by what they show, with no caption needed at query time. The query text goes through CLIP's text encoder so it lands in the image vector space:

```python
def search_facility_images(query_text: str, supplier_id: str, limit: int = 10):
    return client.query_points(
        collection_name="supplier_signals",
        query=models.Document(text=query_text, model=IMAGE_TEXT_MODEL),
        using="image",
        query_filter=models.Filter(
            must=[models.FieldCondition(
                key="supplier_id", match=models.MatchValue(value=supplier_id),
            )]
        ),
        limit=limit,
        with_payload=True,
    )

smoke = search_facility_images("smoke above factory roof", supplier_id="SUP-7291")
```

Each named vector is its own space, so the query has to be embedded by the model that produced the vectors it is searching. Swap `using="text_dense"` and `DENSE_MODEL` and the same call searches article text instead.

### The Analyst Investigation Query

For a focused investigation, run hybrid retrieval over dense and sparse text, scoped to one supplier and to elevated-risk signals from the last week. Put the filter inside each `Prefetch`, as in Modules 3 and 4, so each retriever returns 50 candidates that satisfy it.

```python
def query_supplier_risk(supplier_id: str, query_text: str):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    risk_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="supplier_id",
                match=models.MatchValue(value=supplier_id),
            ),
            models.FieldCondition(
                key="risk_score",
                range=models.Range(gte=0.5),
            ),
            models.FieldCondition(
                key="published_at",
                range=models.DatetimeRange(gte=cutoff),
            ),
        ]
    )

    return client.query_points(
        collection_name="supplier_signals",
        prefetch=[
            models.Prefetch(
                query=models.Document(text=query_text, model=DENSE_MODEL),
                using="text_dense", filter=risk_filter, limit=50,
            ),
            models.Prefetch(
                query=models.Document(text=query_text, model=SPARSE_MODEL),
                using="text_sparse", filter=risk_filter, limit=50,
            ),
        ],
        query=models.RrfQuery(rrf=models.Rrf()),
        limit=10,
    )
```

The image query in the previous section passes the same conditions as a top-level `query_filter` because it has no prefetch.

### Going Further: Cross-Language Comparison

Supply chain news often appears in Japanese, Mandarin, Korean, or Vietnamese before it reaches an English wire, and `all-MiniLM-L6-v2` cannot read any of it. Reaching those sources is one substitution: point `DENSE_MODEL` at a multilingual model such as `intfloat/multilingual-e5-large`, which covers 100 languages and projects all of them into a single vector space. It is a bigger model with different requirements, so budget for three changes rather than one: vectors are 1024-dimensional instead of 384, the collection has to be recreated at that size, and e5 expects a `query:` prefix on search text and `passage:` on stored content, which is easy to skip and lowers retrieval quality without raising an error.

Once every language shares one space, the same English query reaches sources in all of them. Run it twice, once filtered to `language: ["en"]` and once to `["ja", "zh"]`, and compare. If English coverage looks routine while local-language sources return shutdown signals, the local narrative is ahead of the English one, and that gap is where early warnings live. The mechanism is nothing new: the same query with a different `language` filter.

### Try It

Open the notebook and work through these against the collection you just built:

1. Ingest a satellite capture with its `caption` set to an empty string, then run `cluster_and_tag` for that supplier. Confirm the point never appears in a cluster, and find the line in `dense_matrix` that drops it.
2. Add a `source_type` argument to `query_supplier_risk` so an analyst can restrict an investigation to one kind of evidence, satellite captures or transcripts. Put the condition in `risk_filter`, and check the field is indexed in the collection setup before you run it.
3. Run `search_facility_images("smoke above factory roof", ...)` twice, once with `IMAGE_TEXT_MODEL` and once with `DENSE_MODEL`. Predict what the second call does before you run it, then explain the result.

## 7. Knowledge Check

Work through these before you call the capstone done.

<details>
<summary>Why does the collection use named vectors instead of one collection per modality?</summary>

One signal, one point. A single event can carry text and image evidence at the same time, and named vectors keep all of it on that one point, queryable separately, sharing a single payload for filtering. Splitting by modality would scatter one event across collections, duplicate the filtering logic, and leave you joining results in application code.

</details>

<details>
<summary>A satellite image is ingested with no caption. Which parts of this system stop working for it, and why?</summary>

It gets an <code>image</code> vector and nothing else. Image search still finds it, because CLIP matches the query text to the picture. But it has no <code>text_dense</code> vector, so <code>dense_matrix</code> skips it and it can never join a text cluster in Section 5, and no text query will reach it. That is why Section 4 captions images at ingestion rather than treating the caption as optional metadata.

</details>

<details>
<summary>How does CLIP match the query "smoke above factory" to a satellite photo with no text attached?</summary>

CLIP is trained on image and caption pairs, which places pictures and text in one shared embedding space. FastEmbed exposes the two halves separately: <code>Qdrant/clip-ViT-B-32-vision</code> embedded the photo, and <code>Qdrant/clip-ViT-B-32-text</code> has to embed the query so it lands in the same space. Using <code>all-MiniLM-L6-v2</code> instead produces a 384-dimensional vector in an unrelated space, and the query fails on dimension or returns noise.

</details>

<details>
<summary>Why are there three named vectors rather than one per signal source?</summary>

Because two of the sources are not new modalities. A transcript is text the moment it has been transcribed, and a video frame is an image the moment it has been sampled, so both reuse spaces that already exist. Adding a separate vector for transcripts would mean two named vectors holding the same 384-dimensional MiniLM embedding of the same words, with no query able to tell them apart.

</details>

<details>
<summary>In a hybrid query, where does the filter belong?</summary>

Inside each <code>Prefetch</code>. Each retriever searches only the signals that satisfy the filter, so its 50 candidates are scoped before fusion ranks them.

</details>

<details>
<summary>How would you extend this system to detect a risk theme affecting 15 suppliers at once?</summary>

Cluster across suppliers rather than within one: run <code>cluster_and_tag</code> over every signal from the last 24 to 48 hours with no <code>supplier_id</code> filter. A shared theme appears as one tight cluster drawing signals from many suppliers, and its centroid gives you a vector for the emerging narrative, which <code>signals_like_cluster</code> then uses to pull in everything else about it.

</details>

<details>
<summary>The capstone creates every payload index before ingesting anything. Why does the order matter more here than in a single-vector system?</summary>

Qdrant adds filter-aware edges to the HNSW graph from indexed payload values, and only for indexes that exist when the graph is built. An index created later still filters correctly, but earning those edges means rebuilding the graph. This collection has two dense graphs, one for <code>text_dense</code> and one for <code>image</code>, so a late index means rebuilding both. On Qdrant Cloud a missing index also fails loudly rather than slowly, since strict mode rejects filters on unindexed fields.

</details>

## 8. Course Summary

This module completes the Qdrant Beginners course. Here's what was covered:

| Module | Theme | Key concepts covered |
|--------|-------|----------------------|
| Module 1 | Let's Understand Search | Why keyword search fails; how embeddings and semantic search work; the shift from words to meaning. |
| Module 2 | First Principles of Vector Search | Collections, points, vectors, payloads, HNSW, chunking strategies, and the full ingestion pipeline. |
| Module 3 | Sparse vs Dense vs Hybrid Search | BM25 against embeddings; when each fails; hybrid search with rank fusion. |
| Module 4 | Designing a Vector Search System | The five layers of the stack; what to decide before ingesting; what changes as the collection grows; when to add machines; where generation fits; where to run Qdrant. |
| Module 5 | Multimodal Supplier Risk Intelligence | End-to-end capstone: ingest news, transcripts, and images on shared points; cluster risk signals; query every modality. |
| Module 6 | Beyond Similarity (Bonus) | Optional further reading: score boosting, MMR diversity, two-stage reranking, grouping, relevance feedback, and discovery. |

Next, [get #QdrantCertified](/course/beginners/certification/) with the official Beginners exam, which covers Modules 1 through 5.

## 9. References & Further Reading

- [Named Vectors](/documentation/manage-data/vectors/#named-vectors): declaring more than one vector per point and querying a named one with `using`.
- [Hybrid Queries](/documentation/search/hybrid-queries/): prefetch semantics, Reciprocal Rank Fusion with weights, Distribution-Based Score Fusion, and formula queries.
- [Indexing and Filterable HNSW](/documentation/manage-data/indexing/): payload index types, why indexes come before ingestion, and the IDF modifier that BM25 scoring needs.
- [Filtering](/documentation/search/filtering/): full filter syntax used throughout the capstone, including MatchAny and datetime ranges.
- [Bulk Upload](/documentation/manage-data/bulk-upload/): batch sizes and index ordering for the daily ingestion job.
- [FastEmbed](/documentation/fastembed/): the local embedding path behind `models.Document` and `models.Image`, and every model name it accepts.
- [Multimodal and Multilingual RAG](/documentation/tutorials-build-essentials/multimodal-search/): a LlamaIndex tutorial building retrieval over images and text in a shared embedding space.
- [multilingual-e5-large](https://huggingface.co/intfloat/multilingual-e5-large): the multilingual swap from Section 6, with its 100 languages, 1024 dimensions, and required query and passage prefixes.
- [CLIP ViT-B/32](https://huggingface.co/openai/clip-vit-base-patch32): model card for the image model behind `Qdrant/clip-ViT-B-32-vision` and its text counterpart.
