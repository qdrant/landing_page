---
title: "Module 5 Capstone: Multimodal Supplier Risk Intelligence"
short_description: "Module 5 of the Beginners course: the capstone project. Ingest, cluster, and query multimodal supplier signals in one collection."
description: "Build an end-to-end system with everything from Modules 1-4: ingest news, audio, and satellite signals, cluster them into risk themes, and query them."
isLesson: true
weight: 60
---

{{< date >}} Module 5 {{< /date >}}

# Capstone: Multimodal Supplier Risk Intelligence

<!-- TODO (video): add the Module 5 overview video before launch. Follow the Essentials embed pattern. Outro bumper yes, Intro bumper no.
<div class="video">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
  </iframe>
</div>
-->

Apply every concept from Modules 1-4 in a single end-to-end system: ingest daily news, audio, and satellite signals about your suppliers, cluster them into risk themes, and query all of it from one collection.

**Follow-along code**: [Module 5 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module5.ipynb)

#### TL;DR

> Module 4 turned the building blocks into a design. In this module, you'll
build that design as a working system. You'll explore named vectors that
hold text, image, and audio evidence on a single point, then see how a
daily job clusters those signals into the events they describe.
You'll also learn how to search images with text and how to extend the
system across languages. By the end, you'll have
ingested, clustered, and queried multimodal signals from one collection.


## Today's Path

1. Project Overview
2. System Architecture
3. Signal Sources & Embedding Models
4. Ingestion Pipeline
5. Clustering Risk Signals
6. Analyst Queries
7. Knowledge Check
8. Course Summary
9. References & Further Reading

By the end, you'll have built the whole system: ingestion, clustering, and analyst queries over one collection.

## 1. Project Overview

A factory fire at a supplier's plant shows up in a local news report hours before a wire service picks it up. It also shows up in a satellite image, in an earnings call where an executive gets asked about it, and in a supplier's own filing weeks later. Each of those is a signal, and none of them arrives labeled as an incident.

This is the news search system you designed in Module 4, extended in three ways:

- **Multiple modalities**: news, earnings-call audio, satellite imagery, and factory footage, all in one collection.
- **Daily ingestion**: signals arrive every 24 hours rather than as a one-off load.
- **Clustering**: group signals that describe the same underlying event, even when they arrive from different sources and in different formats.

Module 4's five design questions still frame the work. Only the answers get bigger.

## 2. System Architecture

The system has four stages. Each maps to Qdrant primitives you already know.

1. **Ingest**: collect daily signals from news APIs, audio streams, and image feeds. Chunk text, transcribe audio with Whisper, extract keyframes from video.
2. **Embed**: run each part of a signal through its modality-specific model, producing named vectors: `text_dense`, `text_sparse`, `image`, `audio_text`.
3. **Store**: upsert each signal as one `PointStruct` carrying every vector it has, plus a payload: supplier, source type, country, publication date, risk score.
4. **Cluster + Query**: a daily batch tags signals with a `cluster_id`; on demand, analysts run hybrid and image queries against the same collection.

![The four capstone stages stacked top to bottom: ingest, embed, store, then cluster and query, each labeled with the Qdrant primitive it maps to.](/courses/beginners/module-5/four-stage.png)

### Collection Schema

One collection holds all modalities. Named vectors let you query by text, image, or audio from the same point. Every field an analyst filters on is indexed, exactly as you designed in Module 4.

```yaml
collection: supplier_signals

named_vectors:
  text_dense:  { model: bge-small-en-v1.5, size: 384, distance: Cosine }
  text_sparse: { model: BM25, modifier: IDF }
  image:       { model: CLIP, size: 512, distance: Cosine }
  audio_text:  { model: Whisper then MiniLM, size: 384, distance: Cosine }

payload_fields:
  supplier_id:  { type: keyword,  indexed: true }
  source_type:  { type: keyword,  indexed: true, values: [news, satellite, audio, video, filing, social] }
  language:     { type: keyword,  indexed: true }
  country:      { type: keyword,  indexed: true }
  facility_id:  { type: keyword,  indexed: true }
  published_at: { type: datetime, indexed: true }
  risk_score:   { type: float,    indexed: true, range: "0.0 to 1.0" }
  cluster_id:   { type: integer,  indexed: true, note: assigned after ingestion }
  summary:      { type: text,     indexed: false, note: short excerpt or caption }
```

## 3. Signal Sources & Embedding Models

Each signal type needs a different embedding approach. The key principle: choose a model trained on data similar to your domain, and use the same model at query time as at ingestion time.

| Signal source | Modality | Embedding model | Vectors it produces |
|---------------|----------|-----------------|---------------------|
| News articles | text | bge-small-en-v1.5 + BM25 | `text_dense`, `text_sparse` |
| Earnings calls | audio to text | Whisper + MiniLM | `audio_text`, `text_dense` |
| Factory footage | video to frames | CLIP per keyframe | `image` |
| Satellite imagery | image + caption | CLIP, and bge + BM25 on the caption | `image`, `text_dense`, `text_sparse` |
| Financial filings | text | bge-small-en-v1.5 + BM25 | `text_dense`, `text_sparse` |

Satellite captures are the row worth reading twice. The caption is what gives an image its text vectors, and Section 5 depends on those: an uncaptioned image can never join a text cluster.

### Text: Dense and Sparse

News articles and filings each get two text vectors, a dense one for meaning and a sparse one for exact tokens: the hybrid pairing from Module 3. `bge-small-en-v1.5` is the dense side, the same model Module 4's design used, at 384 dimensions. It is English-only, and Section 6 covers what to change if your sources are not.

```bash
pip install "qdrant-client[fastembed]" sentence-transformers openai-whisper transformers torch pillow scikit-learn numpy
```

The dense text model loads once and is reused at ingestion and at query time:

```python
from sentence_transformers import SentenceTransformer

# bge-*-v1.5 needs no query or passage instruction prefix, so the same call
# works for stored content and for search text.
dense_model = SentenceTransformer("BAAI/bge-small-en-v1.5")

stored_vec = dense_model.encode("Executive statement following factory fire")
query_vec  = dense_model.encode("supplier factory fire evacuation")
```

Read the gap between scores rather than the absolute number. A score of 0.8 does not mean "80% relevant", and how tightly a model bunches its scores is a property of the model, not of your data. Score a clearly unrelated chunk alongside your real one and compare the two.

### Audio: Transcribe Then Embed

Earnings calls, analyst briefings, and supplier press conferences arrive as audio. Whisper transcribes them to text; a sentence transformer then embeds the transcript. The `audio_text` named vector captures spoken risk signals that never appear in written news.

```python
import whisper
from sentence_transformers import SentenceTransformer

asr_model        = whisper.load_model("base")
audio_text_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def transcribe(audio_path: str) -> list[str]:
    transcript = asr_model.transcribe(audio_path)["text"]
    return chunk_text(transcript, size=500, overlap=100)
```

### Images and Video: CLIP Embeddings

Satellite imagery of supplier facilities and factory footage are embedded using CLIP (Contrastive Language-Image Pre-training). CLIP projects both images and text into the same vector space, which is what makes text-to-image queries like "smoke above factory" work against satellite photos with no caption attached.

```python
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

clip_model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def embed_image(image_path: str) -> list[float]:
    # Satellite tiles are often RGBA or 16-bit single-band. CLIPProcessor
    # expects RGB, so convert before processing or it fails on real imagery.
    image  = Image.open(image_path).convert("RGB")
    inputs = clip_processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = clip_model.get_image_features(**inputs)
    return features[0].numpy().tolist()  # 512-dim vector

def embed_text_for_image_query(text: str) -> list[float]:
    # CLIP's text encoder, not the sentence transformer: an image query has to
    # land in the same space as the stored image vectors. Truncates at 77 tokens.
    inputs = clip_processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():
        features = clip_model.get_text_features(**inputs)
    return features[0].numpy().tolist()
```

## 4. Ingestion Pipeline

The daily job collects signals, embeds each modality, and upserts them. A risk scoring step assigns an initial `risk_score`, which analysts later filter on.

Sparse vectors come from FastEmbed, which ships with the client:

```python
from fastembed import SparseTextEmbedding
from qdrant_client import models

bm25 = SparseTextEmbedding(model_name="Qdrant/bm25")

def bm25_encode(text: str) -> models.SparseVector:
    emb = next(bm25.embed([text]))
    return models.SparseVector(
        indices=emb.indices.tolist(),
        values=emb.values.tolist(),
    )
```

Two helpers are left for you to write, because both are decisions rather than boilerplate: `chunk_text` (pick a strategy from Module 2) and `score_risk` (start with a keyword baseline and tune it against your own signals).

### Collection Setup

```python
import uuid
from qdrant_client import QdrantClient, models
from qdrant_client.models import PointStruct

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="YOUR_API_KEY",
)

client.create_collection(
    collection_name="supplier_signals",
    vectors_config={
        "text_dense": models.VectorParams(size=384,  distance=models.Distance.COSINE),
        "image":      models.VectorParams(size=512,  distance=models.Distance.COSINE),
        "audio_text": models.VectorParams(size=384,  distance=models.Distance.COSINE),
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
        vectors["text_dense"]  = dense_model.encode(signal["text"]).tolist()
        vectors["text_sparse"] = bm25_encode(signal["text"])

    if signal.get("image_path"):
        vectors["image"] = embed_image(signal["image_path"])

    if signal.get("transcript"):
        vectors["audio_text"] = audio_text_model.encode(signal["transcript"]).tolist()

    point_id = str(uuid.uuid4())
    client.upsert(
        collection_name="supplier_signals",
        points=[
            PointStruct(
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

An article longer than a few hundred words gets chunked first, one point per chunk, because bge-small-en-v1.5 truncates its input at 512 tokens and silently drops the rest:

```python
def ingest_news_article(article: dict):
    for chunk in chunk_text(article["text"], size=500, overlap=100):
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

def ingest_earnings_call(call: dict):
    for chunk in transcribe(call["audio_path"]):
        ingest_signal({**call, "text": chunk, "transcript": chunk, "source_type": "audio"})
```

Keep `source_type` values drawn from the fixed set in the collection schema. A filter written against a value nobody ingests returns nothing, and nothing warns you.

## 5. Clustering Risk Signals

Clustering groups signals that describe the same underlying event, even when they arrive from different sources. A factory fire appears in a local news article, a captioned satellite image, and an earnings call answer. Because Section 4 put a `text_dense` vector on all three, clustering can surface them as one event.

### The Clustering Approach

- **Cluster assignment**: retrieve the day's vectors with `scroll`, run a lightweight k-means (a standard algorithm that groups vectors around k center points) over them, and write a `cluster_id` back to each point.
- **Centroids**: a cluster's center point is itself a vector. Query with it to pull in older signals about the same theme.
- **Cross-supplier clustering**: run the same job with no `supplier_id` filter to find themes affecting many suppliers at once.

### Retrieving Signals for a Supplier

`scroll` returns one page at a time, so page until it hands back a null offset. A single capped call would silently cluster a busy supplier on partial data.

```python
import numpy as np
from datetime import datetime, timedelta, timezone
from qdrant_client.models import Filter, FieldCondition, MatchValue, DatetimeRange

def get_supplier_signals_last_24h(supplier_id: str):
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    scroll_filter = Filter(
        must=[
            FieldCondition(key="supplier_id", match=MatchValue(value=supplier_id)),
            FieldCondition(key="published_at", range=DatetimeRange(gte=since)),
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

    model  = KMeans(
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

## 6. Analyst Queries

One collection, four named vectors, three ways to ask.

### Searching Images With Text

The satellite and video signals are searchable by what they show, with no caption needed at query time. The query text has to go through CLIP's text encoder so it lands in the image vector space, not the sentence transformer's:

```python
def search_facility_images(query_text: str, supplier_id: str, limit: int = 10):
    return client.query_points(
        collection_name="supplier_signals",
        query=embed_text_for_image_query(query_text),   # CLIP text encoder
        using="image",                                  # CLIP image space
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

Swap `using="audio_text"` and the MiniLM encoder to search what was said on earnings calls instead. Each named vector is its own space; the query has to be embedded by the model that produced it.

### The Analyst Investigation Query

For focused investigations, combine everything: hybrid retrieval over dense and sparse text, scoped to one supplier, restricted to elevated-risk signals from the last week. This is the Module 4 production query pattern running on multimodal data, filter placement included.

```python
def query_supplier_risk(supplier_id: str, query_text: str):
    query_vec    = dense_model.encode(query_text).tolist()
    query_sparse = bm25_encode(query_text)
    cutoff       = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

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
            models.Prefetch(query=query_vec,    using="text_dense",
                            filter=risk_filter, limit=50),
            models.Prefetch(query=query_sparse, using="text_sparse",
                            filter=risk_filter, limit=50),
        ],
        query=models.RrfQuery(rrf=models.Rrf()),
        limit=10,
    )
```

### Common Mistake: Filters in the Wrong Place

The filter above sits inside both prefetches rather than being passed once as a top-level `query_filter`, and that placement is the point. A per-prefetch filter narrows what each retriever searches, so both come back with 50 candidates that already satisfy the constraint, and it behaves the same way on every deployment mode. An outer `query_filter` is applied by a real server, but local mode ignores it and raises no error either way, so a notebook can print results that break their own filter while looking perfectly healthy.

The image query in the previous section has no prefetch, which is why the same `query_filter` argument is correct there.

### Going Further: Cross-Language Comparison

Supply chain news often appears in Japanese, Mandarin, Korean, or Vietnamese before it reaches an English wire, and `bge-small-en-v1.5` cannot read any of it. Reaching those sources is one substitution: swap `text_dense` for a multilingual model such as `intfloat/multilingual-e5-large`, which covers 100 languages and projects all of them into a single vector space. It is a bigger model with different requirements, so budget for three changes rather than one: vectors are 1024-dimensional instead of 384, the collection has to be recreated at that size, and e5 expects a `query:` prefix on search text and `passage:` on stored content, which is easy to skip and lowers retrieval quality without raising an error.

Once every language shares one space, the same English query reaches sources in all of them. Run it twice, once filtered to `language: ["en"]` and once to `["ja", "zh"]`, and compare. If English coverage looks routine while local-language sources return shutdown signals, the local narrative is ahead of the English one, and that gap is where early warnings live. The mechanism is nothing new: the same query with a different `language` filter.

### Try It

Extend `query_supplier_risk` so an analyst can restrict an investigation to one kind of evidence, for example only satellite signals or only earnings calls. Add a `source_type` argument, put the condition in `risk_filter`, and check that the field is indexed in the collection setup before you run it.

## 7. Knowledge Check

Work through these before you call the capstone done.

<details>
<summary>Why does the collection use named vectors instead of one collection per modality?</summary>

One signal, one point. A single event can carry text, image, and audio evidence at the same time, and named vectors keep all of it on that one point, queryable separately, sharing a single payload for filtering. Splitting by modality would scatter one event across three collections, triplicate the filtering logic, and leave you joining results in application code.

</details>

<details>
<summary>A satellite image is ingested with no caption. Which parts of this system stop working for it, and why?</summary>

It gets an <code>image</code> vector and nothing else. Image search still finds it, because CLIP matches the query text to the picture. But it has no <code>text_dense</code> vector, so <code>dense_matrix</code> skips it and it can never join a text cluster in Section 5, and no text query will reach it. That is why Section 4 captions images at ingestion rather than treating the caption as optional metadata.

</details>

<details>
<summary>How does CLIP match the query "smoke above factory" to a satellite photo with no text attached?</summary>

CLIP is trained contrastively on image and caption pairs, which places images and text in one shared embedding space. Embed the query with CLIP's <em>text</em> encoder and it lands near a visually matching image vector, so ordinary cosine similarity retrieves the photo. Embedding it with the sentence transformer instead would land it in a different space entirely and return nothing useful.

</details>

<details>
<summary>In a hybrid query, where does the filter belong?</summary>

Inside each <code>Prefetch</code>. It narrows what each retriever searches and behaves the same on every deployment mode. Local mode ignores an outer <code>query_filter</code> without raising an error, which is how a notebook ends up printing results that break its own filter.

</details>

<details>
<summary>How would you extend this system to detect a risk theme affecting 15 suppliers at once?</summary>

Cluster across suppliers rather than within one: run <code>cluster_and_tag</code> over every signal from the last 24 to 48 hours with no <code>supplier_id</code> filter. A shared theme appears as one tight cluster drawing signals from many suppliers, and its centroid gives you a vector for the emerging narrative, which <code>signals_like_cluster</code> then uses to pull in everything else about it.

</details>

<details>
<summary>The capstone creates every payload index before ingesting anything. Why does the order matter more here than in a single-vector system?</summary>

Qdrant adds filter-aware edges to the HNSW graph from indexed payload values, and only for indexes that exist when the graph is built. An index created later still filters correctly, but earning those edges means rebuilding the graph. This collection has three dense graphs, one per named vector, so a late index means rebuilding all three. On Qdrant Cloud a missing index also fails loudly rather than slowly, since strict mode rejects filters on unindexed fields.

</details>

## 8. Course Summary

This module completes the Qdrant Beginners course. Here's what was covered:

| Module | Theme | Key concepts covered |
|--------|-------|----------------------|
| Module 1 | Let's Understand Search | Why keyword search fails; how embeddings and semantic search work; the shift from words to meaning. |
| Module 2 | First Principles of Vector Search | Collections, points, vectors, payloads, HNSW, chunking strategies, and the full ingestion pipeline. |
| Module 3 | Sparse vs Dense vs Hybrid Search | BM25 against embeddings; when each fails; hybrid search with rank fusion. |
| Module 4 | Designing a Vector Search System | The layers of the stack; five design questions; filtering in depth; the RAG pipeline; deployment options. |
| Module 5 | Multimodal Supplier Risk Intelligence | End-to-end capstone: ingest news, audio, and images on shared points; cluster risk signals; query every modality. |
| Module 6 | Beyond Similarity (bonus) | Optional further reading: score boosting, MMR diversity, grouping, and relevance feedback. |

Next, [get #QdrantCertified](/course/beginners/certification/) with the official Beginners exam, which covers Modules 1 through 5.

## 9. References & Further Reading

- [Named Vectors](/documentation/manage-data/vectors/#named-vectors)
  - Declaring more than one vector per point and querying a named one with `using`.
- [Hybrid Queries](/documentation/search/hybrid-queries/)
  - Prefetch semantics, Reciprocal Rank Fusion with weights, Distribution-Based Score Fusion, and formula queries.
- [Indexing and Filterable HNSW](/documentation/manage-data/indexing/)
  - Payload index types, why indexes come before ingestion, and the IDF modifier that BM25 scoring needs.
- [Filtering](/documentation/search/filtering/)
  - Full filter syntax used throughout the capstone, including MatchAny and datetime ranges.
- [Bulk Upload](/documentation/manage-data/bulk-upload/)
  - Batch sizes and index ordering for the daily ingestion job.
- [Multimodal and Multilingual RAG](/documentation/tutorials-build-essentials/multimodal-search/)
  - A LlamaIndex tutorial building retrieval over images and text in a shared embedding space.
- [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)
  - Model card for the dense text model: 384 dimensions, a 512-token limit, and why v1.5 needs no instruction prefix.
- [multilingual-e5-large](https://huggingface.co/intfloat/multilingual-e5-large)
  - The multilingual swap from Section 6: 100 supported languages, 1024 dimensions, and the required query and passage prefixes.
- [CLIP ViT-B/32](https://huggingface.co/openai/clip-vit-base-patch32)
  - Model card for the image and satellite embedding model used here.
