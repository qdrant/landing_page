---
title: Trace Qdrant Hybrid Search with Arize Phoenix
short_description: "Trace staged Qdrant hybrid search with Arize Phoenix to isolate retrieval and selection issues using dense, sparse, and RRF fusion."
description: "Instrument Qdrant hybrid search with Arize Phoenix and OpenTelemetry, indexing AG News with dense and sparse vectors via Qdrant Cloud Inference and tracing staged retrieval with RRF."
weight: 30
aliases:
  - /documentation/tutorials/trace-qdrant-hybrid-search-phoenix/
---

# Trace Qdrant Hybrid Search with Arize Phoenix

| Time: 45 min | Level: Intermediate |
|--------------|---------------------|

Hybrid search improves relevance, but when results look wrong it is hard to know which stage to fix. Qdrant retrieves a fused candidate set, and your code then selects the final results. Without observability, both stages look like a single opaque call.

In this tutorial, you will instrument a staged Qdrant hybrid search with [Arize Phoenix](https://phoenix.arize.com/) and OpenTelemetry. You will index 200 AG News documents in [Qdrant Cloud](https://qdrant.tech/cloud/) with dense and sparse vectors via [Qdrant Cloud Inference](/documentation/cloud/inference/), run hybrid retrieval and send a trace tree to Phoenix that separates what Qdrant returned from what you kept.

## Components

- [Qdrant Cloud](https://qdrant.tech/cloud/) with [Cloud Inference](/documentation/cloud/inference/) for vector embeddings.
- [Arize Phoenix](https://phoenix.arize.com/) for traces and [OpenInference](https://github.com/Arize-ai/openinference) semantic conventions.

Each search creates two spans in Phoenix:

* `qdrant_hybrid_retrieval` — what Qdrant returned
* `select_results` — what your code kept

```text
search
|- qdrant_hybrid_retrieval
`- select_results
```

## Architecture Overview

Two stages:

1. Index — Load 200 AG News texts. Qdrant Cloud Inference creates dense and sparse vectors and stores them in a collection.

2. Search — Send two `Prefetch` queries (dense and sparse), fuse them with [RRF](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf), and record three spans (`search`, `qdrant_hybrid_retrieval`, `select_results`). Phoenix shows candidate IDs vs. result IDs, so you can tell if you need to tune `candidate_limit`, `result_limit`, or the embedding models.

## Prerequisites

### Qdrant Cloud with Cloud Inference

This tutorial uses Qdrant Cloud Inference to avoid local embedding servers. [Create a Qdrant Cloud cluster](https://qdrant.tech/documentation/cloud/create-cluster/) and enable Cloud Inference.

Once the cluster is ready, store the URL and API key as environment variables:

```shell
export QDRANT_URL="https://your-cluster.cloud.qdrant.io"
export QDRANT_API_KEY="your-api-key"
```

### Development Environment

Install Python 3.11 or later and [Docker](https://docs.docker.com/get-docker/).

Install the Python packages:

```shell
python -m pip install arize-phoenix-otel datasets qdrant-client
```

---

### Start the Trace UI

Start Phoenix in a separate terminal:

```shell
docker run --rm -p 6006:6006 arizephoenix/phoenix:latest
```

Open the UI at `http://localhost:6006`. The script exports OTLP traces to `http://localhost:6006/v1/traces`.

## Implementation

The full script is shown at the end of this section.

### Setting Up Tracing and Constants

Register Phoenix once in `main()` and define the collection and inference models. All spans use OpenInference attributes for consistent Phoenix rendering.

```python
import json
import os

from openinference.semconv.trace import OpenInferenceSpanKindValues, SpanAttributes
from phoenix.otel import register
from qdrant_client import QdrantClient

COLLECTION = "ag-news-hybrid-tracing"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
SPARSE_MODEL = "Qdrant/bm25"
EMBEDDING_DIMENSION = 384
PROJECT_NAME = "qdrant-staged-retrieval"
```

In `main()`, the provider is registered to the Phoenix OTLP endpoint:

```python
def main():
    tracer_provider = register(
        project_name=PROJECT_NAME,
        endpoint="http://localhost:6006/v1/traces",
    )
    tracer = tracer_provider.get_tracer(__name__)
    client = QdrantClient(
        url=os.environ["QDRANT_URL"],
        api_key=os.environ["QDRANT_API_KEY"],
        cloud_inference=True,
    )
```

---

- `register`: Creates a `TracerProvider` that batches and exports spans to `http://localhost:6006/v1/traces`.
- `cloud_inference`: Delegates embeddings generation to Qdrant Cloud Inference.

### Defining the Span Helper

Use a small context manager to set status, attributes, and error handling consistently. This keeps `search`, `qdrant_hybrid_retrieval`, and `select_results` uniform.

```python
from contextlib import contextmanager
from opentelemetry.trace import Status, StatusCode

@contextmanager
def span(tracer, name, **attributes):
    with tracer.start_as_current_span(name) as current:
        for key, value in attributes.items():
            if value is not None:
                current.set_attribute(key, value)
        try:
            yield current
        except Exception as error:
            current.set_status(Status(StatusCode.ERROR, str(error)))
            raise
        else:
            current.set_status(Status(StatusCode.OK))
```

---

- Status: Marks spans `OK` on success and `ERROR` with the exception message on failure, visible in Phoenix.
- Attributes: Sets `SpanAttributes.INPUT_VALUE`/`OUTPUT_VALUE` and custom keys like `search.candidate_limit` at span creation.

### Loading AG News

Load 200 documents with stable IDs. The `id` is stored in the payload for later diagnosis.

```python
from datasets import load_dataset

def load_documents():
    dataset = load_dataset("fancyzhx/ag_news", split="train[:200]")
    documents = []
    for index, row in enumerate(dataset):
        documents.append(
            {
                "id": str(index),
                "text": row["text"],
            }
        )
    return documents
```

### Indexing Documents with Dense and Sparse Vectors

Create one collection with a dense vector and a sparse vector, then upsert with `models.Document` so Qdrant Cloud Inference embeds server-side. The span records `document.count`.

```python
from qdrant_client import models

def index_documents(client, tracer, documents):
    with span(
        tracer,
        "index_documents",
        **{
            SpanAttributes.OPENINFERENCE_SPAN_KIND: OpenInferenceSpanKindValues.CHAIN.value,
            "document.count": len(documents),
        },
    ):
        if client.collection_exists(COLLECTION):
            client.delete_collection(COLLECTION)
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config={
                "text-dense": models.VectorParams(
                    size=EMBEDDING_DIMENSION,
                    distance=models.Distance.COSINE,
                ),
            },
            sparse_vectors_config={
                "text-sparse": models.SparseVectorParams(
                    index=models.SparseIndexParams(on_disk=False),
                ),
            },
        )
        client.upsert(
            collection_name=COLLECTION,
            points=[
                models.PointStruct(
                    id=index,
                    vector={
                        "text-dense": models.Document(
                            text=document["text"],
                            model=EMBEDDING_MODEL,
                        ),
                        "text-sparse": models.Document(
                            text=document["text"],
                            model=SPARSE_MODEL,
                        ),
                    },
                    payload=document,
                )
                for index, document in enumerate(documents)
            ],
        )
```

---

- Vectors: `text-dense` (384-d, Cosine) for semantics, `text-sparse` (BM25) for keyword matching.
- Document API: `models.Document(text=..., model=...)` triggers Cloud Inference. No local embeddings models to download.

### Running Staged Hybrid Retrieval

The `search` function creates three nested spans. `qdrant_hybrid_retrieval` fuses dense and sparse prefetch results with RRF. `select_results` slices the fused list to `result_limit`.

```python
def search(client, tracer, query, candidate_limit, result_limit):
    with span(
        tracer,
        "search",
        **{
            SpanAttributes.OPENINFERENCE_SPAN_KIND: OpenInferenceSpanKindValues.CHAIN.value,
            SpanAttributes.INPUT_VALUE: query,
            SpanAttributes.INPUT_MIME_TYPE: "text/plain",
            "search.candidate_limit": candidate_limit,
            "search.result_limit": result_limit,
        },
    ) as search_span:
        with span(
            tracer,
            "qdrant_hybrid_retrieval",
            **{
                SpanAttributes.OPENINFERENCE_SPAN_KIND: OpenInferenceSpanKindValues.RETRIEVER.value,
                SpanAttributes.INPUT_VALUE: query,
                SpanAttributes.INPUT_MIME_TYPE: "text/plain",
                "retrieval.candidate_limit": candidate_limit,
            },
        ) as retrieval_span:
            points = client.query_points(
                collection_name=COLLECTION,
                prefetch=[
                    models.Prefetch(
                        query=models.Document(text=query, model=EMBEDDING_MODEL),
                        using="text-dense",
                        limit=candidate_limit,
                    ),
                    models.Prefetch(
                        query=models.Document(text=query, model=SPARSE_MODEL),
                        using="text-sparse",
                        limit=candidate_limit,
                    ),
                ],
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                limit=candidate_limit,
                with_payload=True,
            ).points
            candidates = [point.payload for point in points]
            candidate_ids = [document["id"] for document in candidates]
            retrieval_span.set_attribute(SpanAttributes.OUTPUT_VALUE, json.dumps(candidates))
            retrieval_span.set_attribute(SpanAttributes.OUTPUT_MIME_TYPE, "application/json")
            retrieval_span.set_attribute("retrieval.document_ids", candidate_ids)

        with span(
            tracer,
            "select_results",
            **{
                SpanAttributes.OPENINFERENCE_SPAN_KIND: OpenInferenceSpanKindValues.CHAIN.value,
                SpanAttributes.INPUT_VALUE: json.dumps(candidates),
                SpanAttributes.INPUT_MIME_TYPE: "application/json",
                "selection.result_limit": result_limit,
            },
        ) as selection_span:
            results = candidates[:result_limit]
            result_ids = [document["id"] for document in results]
            selection_span.set_attribute(SpanAttributes.OUTPUT_VALUE, json.dumps(results))
            selection_span.set_attribute(SpanAttributes.OUTPUT_MIME_TYPE, "application/json")
            selection_span.set_attribute("selection.document_ids", result_ids)

        response = {
            "query": query,
            "candidate_ids": candidate_ids,
            "result_ids": result_ids,
        }
        search_span.set_attribute(SpanAttributes.OUTPUT_VALUE, json.dumps(response))
        search_span.set_attribute(SpanAttributes.OUTPUT_MIME_TYPE, "application/json")
        return response
```

---

- Prefetch + RRF: Each `Prefetch` retrieves `candidate_limit` hits from one vector type. `Fusion.RRF` merges them without additional scoring logic.
- `candidate_limit` vs. `result_limit`: `candidate_limit` controls fused Qdrant candidates and `result_limit` controls final documents after selection.
- Span attributes: `retrieval.document_ids` and `selection.document_ids` let you diff the two stages in Phoenix. `INPUT_VALUE`/`OUTPUT_VALUE` follow OpenInference for Phoenix detail panes.

### Full script

<details>
<summary>Click to expand the complete <code>qdrant_trace.py</code></summary>

```python
import json
import os
from contextlib import contextmanager

from datasets import load_dataset
from openinference.semconv.trace import OpenInferenceSpanKindValues, SpanAttributes
from opentelemetry.trace import Status, StatusCode
from phoenix.otel import register
from qdrant_client import QdrantClient, models

COLLECTION = "ag-news-hybrid-tracing"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
SPARSE_MODEL = "Qdrant/bm25"
EMBEDDING_DIMENSION = 384
PROJECT_NAME = "qdrant-staged-retrieval"


@contextmanager
def span(tracer, name, **attributes):
    with tracer.start_as_current_span(name) as current:
        for key, value in attributes.items():
            if value is not None:
                current.set_attribute(key, value)
        try:
            yield current
        except Exception as error:
            current.set_status(Status(StatusCode.ERROR, str(error)))
            raise
        else:
            current.set_status(Status(StatusCode.OK))


def load_documents():
    dataset = load_dataset("fancyzhx/ag_news", split="train[:200]")
    documents = []
    for index, row in enumerate(dataset):
        documents.append(
            {
                "id": str(index),
                "text": row["text"],
            }
        )
    return documents


def index_documents(client, tracer, documents):
    with span(
        tracer,
        "index_documents",
        **{
            SpanAttributes.OPENINFERENCE_SPAN_KIND: OpenInferenceSpanKindValues.CHAIN.value,
            "document.count": len(documents),
        },
    ):
        if client.collection_exists(COLLECTION):
            client.delete_collection(COLLECTION)
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config={
                "text-dense": models.VectorParams(
                    size=EMBEDDING_DIMENSION,
                    distance=models.Distance.COSINE,
                ),
            },
            sparse_vectors_config={
                "text-sparse": models.SparseVectorParams(
                    index=models.SparseIndexParams(on_disk=False),
                ),
            },
        )
        client.upsert(
            collection_name=COLLECTION,
            points=[
                models.PointStruct(
                    id=index,
                    vector={
                        "text-dense": models.Document(
                            text=document["text"],
                            model=EMBEDDING_MODEL,
                        ),
                        "text-sparse": models.Document(
                            text=document["text"],
                            model=SPARSE_MODEL,
                        ),
                    },
                    payload=document,
                )
                for index, document in enumerate(documents)
            ],
        )


def search(client, tracer, query, candidate_limit, result_limit):
    with span(
        tracer,
        "search",
        **{
            SpanAttributes.OPENINFERENCE_SPAN_KIND: OpenInferenceSpanKindValues.CHAIN.value,
            SpanAttributes.INPUT_VALUE: query,
            SpanAttributes.INPUT_MIME_TYPE: "text/plain",
            "search.candidate_limit": candidate_limit,
            "search.result_limit": result_limit,
        },
    ) as search_span:
        with span(
            tracer,
            "qdrant_hybrid_retrieval",
            **{
                SpanAttributes.OPENINFERENCE_SPAN_KIND: OpenInferenceSpanKindValues.RETRIEVER.value,
                SpanAttributes.INPUT_VALUE: query,
                SpanAttributes.INPUT_MIME_TYPE: "text/plain",
                "retrieval.candidate_limit": candidate_limit,
            },
        ) as retrieval_span:
            points = client.query_points(
                collection_name=COLLECTION,
                prefetch=[
                    models.Prefetch(
                        query=models.Document(text=query, model=EMBEDDING_MODEL),
                        using="text-dense",
                        limit=candidate_limit,
                    ),
                    models.Prefetch(
                        query=models.Document(text=query, model=SPARSE_MODEL),
                        using="text-sparse",
                        limit=candidate_limit,
                    ),
                ],
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                limit=candidate_limit,
                with_payload=True,
            ).points
            candidates = [point.payload for point in points]
            candidate_ids = [document["id"] for document in candidates]
            retrieval_span.set_attribute(SpanAttributes.OUTPUT_VALUE, json.dumps(candidates))
            retrieval_span.set_attribute(SpanAttributes.OUTPUT_MIME_TYPE, "application/json")
            retrieval_span.set_attribute("retrieval.document_ids", candidate_ids)

        with span(
            tracer,
            "select_results",
            **{
                SpanAttributes.OPENINFERENCE_SPAN_KIND: OpenInferenceSpanKindValues.CHAIN.value,
                SpanAttributes.INPUT_VALUE: json.dumps(candidates),
                SpanAttributes.INPUT_MIME_TYPE: "application/json",
                "selection.result_limit": result_limit,
            },
        ) as selection_span:
            results = candidates[:result_limit]
            result_ids = [document["id"] for document in results]
            selection_span.set_attribute(SpanAttributes.OUTPUT_VALUE, json.dumps(results))
            selection_span.set_attribute(SpanAttributes.OUTPUT_MIME_TYPE, "application/json")
            selection_span.set_attribute("selection.document_ids", result_ids)

        response = {
            "query": query,
            "candidate_ids": candidate_ids,
            "result_ids": result_ids,
        }
        search_span.set_attribute(SpanAttributes.OUTPUT_VALUE, json.dumps(response))
        search_span.set_attribute(SpanAttributes.OUTPUT_MIME_TYPE, "application/json")
        return response


def main():
    tracer_provider = register(
        project_name=PROJECT_NAME,
        endpoint="http://localhost:6006/v1/traces",
    )
    tracer = tracer_provider.get_tracer(__name__)
    client = QdrantClient(
        url=os.environ["QDRANT_URL"],
        api_key=os.environ["QDRANT_API_KEY"],
        cloud_inference=True,
    )

    documents = load_documents()
    index_documents(client, tracer, documents)

    response = search(client, tracer, "sports", 12, 6)
    print(json.dumps(response, indent=2))

    tracer_provider.force_flush()
    tracer_provider.shutdown()


if __name__ == "__main__":
    main()
```

</details>

### Index and Search

Run the script with the Qdrant environment variables set:

```shell
python qdrant_trace.py
```

The script downloads 200 AG News records, creates the `ag-news-hybrid-tracing` collection, and runs a `sports` query with `candidate_limit=12` and `result_limit=6`.

Each search prints a JSON object with the two ID lists:

```json
{
  "query": "sports",
  "candidate_ids": ["99", "33", "157", "..."],
  "result_ids": ["99", "33", "157", "90", "66", "68"]
}
```

`candidate_ids` shows the fused RRF candidates. `result_ids` is the slice after selection.

## Observe the Traces

### Locate a Trace

Open `http://localhost:6006`. Select the `qdrant-staged-retrieval` project, then open the Spans view.

![Phoenix trace list showing qdrant-staged-retrieval project with root search span](/documentation/examples/trace-qdrant-hybrid-search-phoenix/phoenix-trace-list.png)

Find the root `search` span with Input `sports`. It records the query, both limits, and the response. The `index_documents` span is a separate trace — filter by name if needed.

### Read the Spans

Select the root `search` span. Phoenix opens the span tree and the detail pane.

![Expanded Phoenix trace with search parent and qdrant_hybrid_retrieval and select_results children](/documentation/examples/trace-qdrant-hybrid-search-phoenix/phoenix-trace-detail.png)

Select `qdrant_hybrid_retrieval` first. Read these attributes:

- `retrieval.document_ids` — IDs Qdrant returned after RRF
- `retrieval.candidate_limit` — the prefetch/fused limit sent to Qdrant
- `OUTPUT_VALUE` — full payloads of candidates (JSON)

Then select `select_results`. Read these attributes:

- `selection.document_ids` — IDs kept after `candidates[:result_limit]`
- `selection.result_limit` — the slice limit
- `INPUT_VALUE` — the candidate list that entered selection

### See What Changed

The retrieval span shows what Qdrant found. The selection span shows what you kept. Compare the two ID lists:

- If the document you expect is in `retrieval.document_ids` but not in `selection.document_ids`, raise `result_limit` or add a reranker instead of a hard slice.
- If the document is in neither list, raise `candidate_limit` or tune the dense/sparse queries (different embedding model, BM25 parameters, or fusion).

## Next Steps

You now have a minimal, staged tracing pattern for Qdrant hybrid search. Extend it by adding a reranking span between retrieval and selection, recording scores as `retrieval.scores`, or wrapping the inference calls.

To run this with your own embeddings, swap `EMBEDDING_MODEL` and `SPARSE_MODEL` for any [Cloud Inference](/documentation/cloud/inference/) models or local models. For production, export traces to a persistent Phoenix instance or any OTLP collector instead of `localhost:6006`.

If you have questions, ask on our [Discord community](https://qdrant.to/discord).
