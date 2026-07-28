---
title: "Module 5 Capstone: Multimodal Supplier Risk Intelligence"
short_description: "Module 5 of the Beginners course: the capstone project. Ingest, cluster, and query multimodal supplier signals across languages."
description: "Apply every concept from Modules 1-4 in one end-to-end system: ingest news, audio, and satellite data about suppliers, cluster risk signals, and query across languages."
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

Apply every concept from Modules 1-4 in a single end-to-end system: ingest daily news, audio, and satellite data about suppliers, cluster risk signals into themes, and surface what local-language sources are saying before it reaches English media.

**Follow-along code**: [Module 5 notebook](https://github.com/qdrant/examples/blob/master/Beginner-course/Module5.ipynb)


## Today's Path

1. Project Overview
2. System Architecture
3. Signal Sources & Embedding Models
4. Ingestion Pipeline
5. Clustering Risk Signals
6. Cross-Language Risk Queries
7. Knowledge Check
8. Course Summary
9. References & Further Reading


## 1. Project Overview

Supply chain risk is invisible until it isn't. A factory fire in Vietnam, a labor dispute in Bangladesh, a regulatory change in China: these events appear as signals across dozens of data sources, in different languages, in different modalities, before they become formal incidents. The goal of this project is to make those signals retrievable before the incident.

This is the news search system you designed in Module 4, extended in three ways:

- **Daily Signals**: News, earnings calls, satellite images, and factory footage, ingested every 24 hours.
- **Clustering**: Group signals by supplier, topic, and risk theme using vector proximity.
- **Cross-Language Queries**: Ask in English, retrieve what Japanese and Chinese sources are saying.

Module 4's five design questions still frame the work. Only the answers get bigger.

## 2. System Architecture

The system has four stages. Each maps to Qdrant primitives you already know.

1. **Ingest**: Collect daily signals from news APIs, audio streams, and image feeds. Chunk text, transcribe audio via Whisper, extract keyframes from video.
2. **Embed**: Run each chunk through its modality-specific embedding model. Produce named vectors: `text_dense`, `text_sparse`, `image`, `audio_text`.
3. **Store**: Upsert each signal as a `PointStruct` with its named vectors and a rich payload: supplier, source type, language, country, publication date, risk score.
4. **Cluster + Query**: Daily batch: compute cluster centroids and tag signals with themes. On demand: hybrid, cross-language queries for analyst investigations.

![The four capstone stages, ingest, embed, store, then cluster and query, flowing left to right into a single Qdrant collection of supplier signals.](/courses/beginners/module-5/four-stage.png)

### Collection Schema

One collection holds all modalities. Named vectors let you query by text, image, or audio from the same point. Every field an analyst filters on is indexed, exactly as you designed in Module 4.

```yaml
collection: supplier_signals

named_vectors:
  text_dense:  { model: multilingual-e5-large, size: 1024, distance: Cosine }
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
  summary:      { type: keyword,  indexed: false, note: short excerpt or caption }
```

## 3. Signal Sources & Embedding Models

Each signal type requires a different embedding approach. The key principle: choose a model trained on data similar to your domain, and use the same model at query time as at ingestion time.

| Signal source | Modality | Embedding model | Payload fields |
|---------------|----------|-----------------|----------------|
| News articles | text | multilingual-e5-large | supplier_id, country, language, published_at, risk_score |
| Earnings calls | audio to text | Whisper + MiniLM | supplier_id, language, published_at, risk_score |
| Factory footage | video to frames | CLIP per keyframe | supplier_id, facility_id, published_at, risk_score |
| Satellite imagery | image | CLIP | supplier_id, facility_id, country, published_at |
| Financial filings | text | fin-e5 or MiniLM | supplier_id, country, published_at, risk_score |
| Social / forums | text | multilingual-e5-large + BM25 | supplier_id, language, published_at, risk_score |

### Multilingual Text: Why multilingual-e5-large

Supply chain news arrives in Japanese, Mandarin, Korean, Vietnamese, Hindi, and dozens of other languages before it reaches English. This is the knowledge-layer decision from Module 4's Question 4, now in action. multilingual-e5-large is initialized from XLM-RoBERTa and inherits its 100 languages, projecting all of them into one vector space, so a query in English surfaces relevant articles originally written in Japanese with no translation step. Expect weaker results on low-resource languages, which the model card is explicit about.

Note the `query:` and `passage:` prefixes below. The e5 family is trained with them: use `query:` for search text and `passage:` for stored content. Skipping them lowers retrieval quality quietly, without any error.

You don't need to read Japanese to verify this: the gloss, a literal English translation shown only so the example is checkable, makes it clear the two texts share meaning, even though the model itself never sees the gloss.

```python
from sentence_transformers import SentenceTransformer

# One model for all 100 languages, though low-resource ones degrade
dense_model = SentenceTransformer("intfloat/multilingual-e5-large")

# English query finds Japanese-language articles
query_vec = dense_model.encode("query: supplier factory fire evacuation")

# At ingestion: Japanese article embedded with the same model
# dense_model.encode("passage: 工場火災下の経営者声明")
# Gloss (for verification only, not passed to the model): "Executive statement following factory fire"
#
# Cosine similarity between these two vectors: ~0.81
# Calibrate before trusting that number. multilingual-e5 similarities compress
# into roughly the 0.7 to 1.0 band, so also score a clearly unrelated passage
# and read the gap between the two, not 0.81 as though it meant "81% relevant".
```

### Audio: Transcribe Then Embed

Earnings calls, analyst briefings, and supplier press conferences arrive as audio. Whisper transcribes them to text; a sentence transformer then embeds the transcript. The `audio_text` named vector captures spoken risk signals that never appear in written news.

```python
import whisper
from sentence_transformers import SentenceTransformer

asr_model        = whisper.load_model("base")
audio_text_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_audio(audio_path: str):
    transcript = asr_model.transcribe(audio_path)["text"]
    chunks     = chunk_text(transcript, size=500, overlap=100)
    return [
        {
            "text":   chunk,
            "vector": audio_text_model.encode(chunk).tolist(),
        }
        for chunk in chunks
    ]
```

### Images and Video: CLIP Embeddings

Satellite imagery of supplier facilities and factory footage are embedded using CLIP (Contrastive Language-Image Pre-training). CLIP projects both images and text into the same vector space, which is what makes text-to-image queries like "smoke above factory" work against satellite photos.

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
    # CLIP truncates at 77 tokens, so keep image queries short.
    inputs = clip_processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():
        features = clip_model.get_text_features(**inputs)
    return features[0].numpy().tolist()
```

## 4. Ingestion Pipeline

The daily ingestion job collects signals, embeds each modality, and upserts them as points with their named vectors. A risk scoring step assigns an initial `risk_score` to each point, which analysts later use as a filter field.

Three helpers appear throughout this module and are left for you to implement: `chunk_text` (the Module 2 chunking strategies), `bm25_encode` (Module 3 sparse vectors, or FastEmbed's `Bm25` model), and `score_risk` (start with a keyword baseline).

### Collection Setup

```python
import os
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

client.create_collection(
    collection_name="supplier_signals",
    vectors_config={
        "text_dense": models.VectorParams(size=1024, distance=models.Distance.COSINE),
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

### Upserting a Multimodal Point

```python
import uuid
from qdrant_client.models import PointStruct

def ingest_news_article(article: dict):
    text_dense_vec  = dense_model.encode(f"passage: {article['text']}").tolist()
    text_sparse_vec = bm25_encode(article["text"])   # {indices, values}
    risk_score      = score_risk(article["text"])    # 0.0 to 1.0

    client.upsert(
        collection_name="supplier_signals",
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector={
                    "text_dense":  text_dense_vec,
                    "text_sparse": text_sparse_vec,
                },
                payload={
                    "supplier_id":  article["supplier_id"],
                    "source_type":  "news",
                    "language":     article["language"],
                    "country":      article["country"],
                    "published_at": article["published_at"],
                    "risk_score":   risk_score,
                    "summary":      article["text"][:300],
                },
            )
        ],
    )

def ingest_satellite_image(image_path: str, meta: dict):
    client.upsert(
        collection_name="supplier_signals",
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector={"image": embed_image(image_path)},
                payload={
                    "supplier_id":  meta["supplier_id"],
                    "source_type":  "satellite",
                    "country":      meta["country"],
                    "facility_id":  meta["facility_id"],
                    "published_at": meta["capture_date"],
                    "risk_score":   meta.get("risk_score", 0.0),
                },
            )
        ],
    )
```

Keep `source_type` values drawn from the fixed set in the collection schema. A filter written against a value nobody ingests returns nothing, and nothing warns you.

### Ingesting an Earnings Call

Audio produces several points per file, one per transcript chunk, each carrying the `audio_text` vector:

```python
def ingest_earnings_call(audio_path: str, meta: dict):
    client.upsert(
        collection_name="supplier_signals",
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector={"audio_text": chunk["vector"]},
                payload={
                    "supplier_id":  meta["supplier_id"],
                    "source_type":  "audio",
                    "language":     meta.get("language", "en"),
                    "published_at": meta["call_date"],
                    "risk_score":   score_risk(chunk["text"]),
                    "summary":      chunk["text"][:300],
                },
            )
            for chunk in embed_audio(audio_path)
        ],
    )
```

## 5. Clustering Risk Signals

Clustering groups signals that discuss the same underlying risk event, even when they come from different sources, languages, or modalities. A factory fire will appear in Japanese news articles, an English satellite alert, and a Chinese social media post. Clustering surfaces them as a single event.

### The Clustering Approach

- **Daily centroid computation**: For each supplier, compute the mean vector of all signals ingested in the last 24 hours. This becomes the daily centroid for that supplier.
- **Cluster assignment**: Retrieve the day's vectors with `scroll`, run a lightweight k-means over them, and assign a `cluster_id` to each point via a payload update.
- **Cross-supplier clustering**: Run clustering across all suppliers to find shared risk themes. "Port congestion in Southeast Asia" may affect 15 suppliers at once.

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
    """Unit-normalized text_dense vectors, with the point IDs they belong to."""
    ids, vecs = [], []
    for p in points:
        if p.vector and "text_dense" in p.vector:   # image-only points have none
            ids.append(p.id)
            vecs.append(p.vector["text_dense"])
    if not vecs:
        return [], None

    arr = np.asarray(vecs, dtype=np.float32)
    # e5 vectors are stored unnormalized and k-means measures Euclidean
    # distance, so normalize first to make the clustering behave like cosine.
    arr /= np.linalg.norm(arr, axis=1, keepdims=True)
    return ids, arr

def compute_centroid(points):
    _, arr = dense_matrix(points)
    if arr is None:
        return None
    centroid = arr.mean(axis=0)
    return (centroid / np.linalg.norm(centroid)).tolist()
```

### Writing Cluster IDs Back to Payload

```python
from sklearn.cluster import KMeans

def cluster_and_tag(supplier_id: str, n_clusters: int = 5):
    points   = get_supplier_signals_last_24h(supplier_id)
    ids, arr = dense_matrix(points)

    if arr is None or len(ids) < n_clusters:
        return  # not enough signals to cluster meaningfully

    labels = KMeans(
        n_clusters=n_clusters,
        n_init=10,
        random_state=42,    # reproducible runs while you're learning
    ).fit_predict(arr)

    # One call per cluster, not one per point
    for label in sorted(set(int(l) for l in labels)):
        client.set_payload(
            collection_name="supplier_signals",
            payload={"cluster_id": label},
            points=[pid for pid, l in zip(ids, labels) if int(l) == label],
        )
```

A fixed `n_clusters=5` is a placeholder, not a recommendation. The number of distinct risk themes in a day varies by supplier, so treat k as something to evaluate rather than a constant.

## 6. Cross-Language Risk Queries

The most actionable early signals are often the ones that appear in local-language sources before they reach English media. Because every language lives in the same vector space, surfacing them is a retrieval task, not a translation project.

### Querying Across Languages

With multilingual-e5-large, a risk analyst can query in English and retrieve the most relevant signals regardless of which language they were originally written in. No translation is required at query time.

```python
def cross_language_risk_query(supplier_id: str, query_en: str, languages: list[str]):
    """
    Query in English; retrieve signals in any specified language.
    Useful for finding what local sources are saying about a supplier
    that hasn't surfaced in English news yet.
    """
    query_vec = dense_model.encode(f"query: {query_en}").tolist()

    return client.query_points(
        collection_name="supplier_signals",
        query=query_vec,
        using="text_dense",
        query_filter=models.Filter(     # no prefetch here, so the filter applies
            must=[                      # to the search itself
                models.FieldCondition(
                    key="supplier_id",
                    match=models.MatchValue(value=supplier_id),
                ),
                models.FieldCondition(
                    key="language",
                    match=models.MatchAny(any=languages),
                ),
            ]
        ),
        limit=10,
        with_payload=True,
    )

# Example: find Japanese and Chinese signals about this supplier's factory
results = cross_language_risk_query(
    supplier_id="SUP-7291",
    query_en="factory shutdown production halt",
    languages=["ja", "zh"],
)
```

### The Analyst Investigation Query

For focused investigations, combine everything: hybrid retrieval over dense and sparse vectors, scoped to one supplier, restricted to elevated-risk signals from the last week. This is the Module 4 production query pattern running on multimodal data, filter placement included.

```python
def query_supplier_risk(supplier_id: str, query_text: str):
    query_vec    = dense_model.encode(f"query: {query_text}").tolist()
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

The filter above is repeated inside both prefetches rather than passed once as a top-level `query_filter`, and that placement is the whole point. Once a query has prefetches, Qdrant runs them first and applies the outer query to their results. A top-level filter would let each retriever search every supplier, then trim the fused 100 candidates at the end. Scoped to one supplier out of thousands, that returns nothing useful, and it raises no error while doing it.

The cross-language query in the previous section has no prefetch, which is why the same `query_filter` argument is correct there.

### Comparing Narratives Across Languages

A useful analyst workflow: run the same query twice, once filtered to English sources and once to local-language sources, and compare what comes back. If English coverage of a supplier looks routine while Japanese and Chinese sources return signals about shutdowns or disputes, the local-language narrative is ahead of the English one, and that gap is exactly where early warnings live. The mechanism is nothing new: the same cross-language query with a different `language` filter.

## 7. Knowledge Check

These questions cover the capstone. Answer each one before opening the answer.

{{< details summary="Why does the supplier risk system use multilingual-e5-large instead of a monolingual English model?" >}}
Supply chain risk signals surface in local-language sources, Japanese, Mandarin, Korean, and Vietnamese, before they reach English media. multilingual-e5-large is initialized from XLM-RoBERTa and inherits its 100 languages, all projected into one shared vector space, so an English query retrieves relevant articles whatever language they were written in, with no translation step at query time. Two caveats the model card is explicit about: prefix every input with `query: ` or `passage: `, because the model was trained that way and omitting it quietly degrades retrieval rather than failing, and expect weaker results on low-resource languages.
{{< /details >}}

{{< details summary="Why does the collection use named vectors instead of one collection per modality?" >}}
One signal, one point. A single event can carry text, image, and audio evidence at the same time, and named vectors keep all three on that one point, queryable separately or together, sharing a single payload for filtering. Splitting by modality would scatter one event across three collections, triplicate the filtering logic, and leave you joining results in application code.
{{< /details >}}

{{< details summary="How does CLIP match the query 'smoke above factory' to a satellite photo with no text attached?" >}}
CLIP is trained contrastively on image and caption pairs, which places images and text in one shared embedding space. The query vector and a visually matching image vector land close together in that space, so ordinary cosine similarity retrieves the photo. No caption, filename, or tag is involved, which is the whole point: the image is searchable by what it shows.
{{< /details >}}

{{< details summary="A supplier's English coverage looks routine, but the same query filtered to Japanese and Chinese sources returns shutdown-related signals. What does that tell you, and what makes the comparison possible?" >}}
The local-language narrative is running ahead of the English one, which is where early warning usually appears first. The comparison is only possible because one multilingual model embeds every language into a single space, so a single English query is meaningful against sources in any language, and because an indexed `language` payload field lets you scope each run to a different set of sources.
{{< /details >}}

{{< details summary="How would you extend this system to detect a risk theme affecting 15 suppliers at once?" >}}
Cluster across suppliers rather than within one: run clustering over every signal from the last 24 to 48 hours with no `supplier_id` filter applied. A shared theme appears as one tight cluster drawing signals from many suppliers at once, and the cluster centroid gives you a vector for the emerging narrative, which you can then use as a query to find more of it.
{{< /details >}}

{{< details summary="Why does the analyst investigation query use hybrid retrieval rather than dense-only?" >}}
Analyst queries mix semantic intent ("production disruption") with exact tokens: supplier codes, facility IDs, ticker symbols. Dense retrieval carries the intent, sparse pins the exact tokens, and Reciprocal Rank Fusion combines the two rankings. It's the same pattern as the Module 4 news system, including where the filter goes: inside each prefetch, never on the outer query.
{{< /details >}}

{{< details summary="The capstone creates every payload index immediately after creating the collection, before ingesting anything. Why does the order matter here more than in a single-vector system?" >}}
Qdrant adds filter-aware edges to the HNSW graph from indexed payload values, and it can only add them for indexes that exist when the graph is built. Create an index later and you have to rebuild the graph to benefit. In this collection there are three dense HNSW graphs, one per named vector, so a late index means rebuilding all of them. Missing a float field like `risk_score` also fails loudly rather than slowly on Qdrant Cloud, where strict mode rejects filters on unindexed fields by default.
{{< /details >}}

## 8. Course Summary

This module completes the Qdrant Beginners course. Here's what was covered across all five modules:

| Module | Theme | Key concepts covered |
|--------|-------|----------------------|
| Module 1 | Understand Search | Why keyword search fails; how embeddings and semantic search work; the shift from words to meaning. |
| Module 2 | Anatomy of a Vector | Collections, points, vectors, payloads, HNSW, chunking strategies, and the full ingestion pipeline. |
| Module 3 | Sparse, Dense & Hybrid | BM25 vs embeddings; when each fails; hybrid search with rank fusion; multimodal search basics. |
| Module 4 | Designing a System | The layers of the stack; five design questions; filtering in depth; the RAG pipeline; deployment options. |
| Module 5 | Multimodal Supplier Risk | End-to-end capstone: ingest news, audio, and images; cluster risk signals; query across languages. |


## 9. References & Further Reading
- [Multimodal Search](/documentation/multimodal-search/)
  - Images and text in one collection through a shared embedding space, with named vectors.
- [Named Vectors](/documentation/manage-data/vectors/)
  - Declaring several vectors per point and querying one of them with `using`.
- [Hybrid Queries](/documentation/search/hybrid-queries/)
  - Prefetch semantics, Reciprocal Rank Fusion with weights, Distribution-Based Score Fusion, and formula queries.
- [Indexing and Filterable HNSW](/documentation/manage-data/indexing/)
  - Payload index types, why indexes come before ingestion, and the IDF modifier that BM25 scoring needs.
- [Filtering](/documentation/search/filtering/)
  - Full filter syntax used throughout the capstone, including MatchAny and datetime ranges.
- [Bulk Upload](/documentation/manage-data/bulk-upload/)
  - Batch sizes and index ordering for the daily ingestion job.
- [multilingual-e5-large](https://huggingface.co/intfloat/multilingual-e5-large)
  - Model card: the 100 supported languages, the required query and passage prefixes, and why cosine scores sit in a narrow band.
- [CLIP ViT-B/32](https://huggingface.co/openai/clip-vit-base-patch32)
  - Model card for the image and satellite embedding model used here.

<!-- TODO (course completion): let the theme render the course-complete element here instead of plain text. Confirm whether the certificate / completion CTA (as in Essentials) should render on this final module. -->
