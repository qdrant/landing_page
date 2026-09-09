---
title: "Ingestion Pipeline"
short_description: "Module 5 of the Beginner Course: embed each modality, score risk, and upsert with the right indexes."
description: "Build the daily job: collect signals, embed each modality, assign a risk score, and create every payload index analysts will filter on before ingesting."
weight: 4
isLesson: true
---

{{< date >}} Module 5 {{< /date >}}

# Ingestion Pipeline

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

`risk_score` and `cluster_id` are easy to forget here, because nothing filters on them until [Clustering Risk Signals](/course/beginners/module-5/clustering-risk-signals/) and [Analyst Queries](/course/beginners/module-5/analyst-queries/). Skip them and the analyst query doesn't just run slowly: Qdrant Cloud enables strict mode by default, so a query filtering an unindexed field is rejected outright.

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
    # text_dense vector, so it can never join a text cluster and
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

One quarterly call, ingested from the excerpts defined in [Signal Sources and Embedding Models](/course/beginners/module-5/signal-sources-and-embedding-models/):

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
