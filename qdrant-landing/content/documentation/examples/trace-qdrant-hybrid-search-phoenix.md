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

Hybrid search makes results more relevant. When the results are wrong, you cannot tell which stage to fix. Qdrant returns a fused set of candidates. Your code then selects the final results from that set. Without observability, both stages look like one call.

In this tutorial, you instrument a staged Qdrant hybrid search with [Arize Phoenix](https://phoenix.arize.com/) and OpenTelemetry. You index 200 AG News documents in [Qdrant Cloud](https://qdrant.tech/cloud/) with dense and sparse vectors via [Qdrant Cloud Inference](/documentation/cloud/inference/). Then you run hybrid retrieval and send a trace tree to Phoenix. The tree shows what Qdrant returned and what your code kept.

## Concepts

If you need a primer on how hybrid search works, read the [hybrid search guide](/documentation/search/hybrid-queries/).

The problem we solve is simple to state and hard to debug: when a hybrid search returns the wrong results, you cannot tell which stage failed. Tracing makes each stage visible.

### What a trace shows

[OpenTelemetry](https://opentelemetry.io/) is an open standard that records operations as spans (timed units of work with inputs, outputs, and metadata). A trace is a tree of spans for one request. [Arize Phoenix](https://arize.com/phoenix/) is a UI that receives spans over OTLP and renders the tree so you can inspect each stage.

### One search, two stages to observe

A hybrid search makes two decisions that usually run as one block of code:

1. Retrieval. Qdrant fuses the dense and sparse results and returns a candidate set (`candidate_limit` documents).
2. Selection. Your code keeps a smaller slice (`result_limit` documents), or reranks and filters them.

When the final answer is wrong, the fault can sit in either stage. The two stages look the same in a single log line or one Qdrant call. Qdrant can fail to return the right document. Your selection logic can also drop it after Qdrant returns it.

### Spans make the stages visible

In this tutorial, each search emits three nested spans:

```text
search
|- qdrant_hybrid_retrieval
`- select_results
```

`qdrant_hybrid_retrieval` records what Qdrant returned. `select_results` records what your code kept. Compare the document IDs of the two spans to find the stage to fix.

### Components

- [Qdrant Cloud](https://qdrant.tech/cloud/) with [Cloud Inference](/documentation/cloud/inference/) for vector embeddings.
- [Arize Phoenix](https://phoenix.arize.com/) for traces and [OpenInference](https://github.com/Arize-ai/openinference) semantic conventions.

Each search creates two spans in Phoenix:

* `qdrant_hybrid_retrieval`: what Qdrant returned
* `select_results`: what your code kept

```text
search
|- qdrant_hybrid_retrieval
`- select_results
```

## Architecture Overview

Two stages:

1. Index. Load 200 AG News texts. Qdrant Cloud Inference creates dense and sparse vectors and stores them in a collection.

2. Search. Send two `Prefetch` queries (dense and sparse). Fuse them with [RRF](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf). Record three spans: `search`, `qdrant_hybrid_retrieval`, and `select_results`. Phoenix shows the candidate IDs and the result IDs. Use the two ID lists to tune `candidate_limit`, `result_limit`, or the embedding models.

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

Register Phoenix once in `main()` and define the collection and the inference models. All spans use OpenInference attributes so Phoenix renders them the same way.

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

In `main()`, you register the provider to the Phoenix OTLP endpoint:

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
- `cloud_inference`: Delegates embedding generation to Qdrant Cloud Inference.

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

- Status: Marks a span `OK` on success. On failure, marks it `ERROR` and adds the exception message. Phoenix shows the status.
- Attributes: Sets `SpanAttributes.INPUT_VALUE` and `OUTPUT_VALUE`. Also sets custom keys such as `search.candidate_limit` when the span starts.

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

Create one collection with a dense vector and a sparse vector. Then upsert with `models.Document` so Qdrant Cloud Inference embeds server-side. The span records `document.count`.

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

- Vectors: `text-dense` (384 dimensions, Cosine) and `text-sparse` (BM25).
- Document API: `models.Document(text=..., model=...)` triggers Cloud Inference. You do not download local embedding models.

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
- Span attributes: `retrieval.document_ids` and `selection.document_ids` let you compare the two stages in Phoenix. `INPUT_VALUE` and `OUTPUT_VALUE` follow the OpenInference format for the Phoenix detail panes.

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

The script downloads 200 AG News records. It creates the `ag-news-hybrid-tracing` collection. It runs a `sports` query with `candidate_limit=12` and `result_limit=6`.

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

Run the script. Then open `http://localhost:6006`. Every span in this tutorial is in the `qdrant-staged-retrieval` project.

### Locate a Trace

Select the `qdrant-staged-retrieval` project in the project picker. Then open the **Spans** view.

![Phoenix trace list showing qdrant-staged-retrieval project with root search span](/documentation/examples/trace-qdrant-hybrid-search-phoenix/phoenix-trace-list.png)

The Spans view lists every span as a row. Each row shows the name, latency, and start time. Each run makes two root spans:

- `index_documents`: one span that records the indexing step.
- `search`: the root of the search trace, with Input `sports`.

Filter by name (`search`) or by Input (`sports`) to find these spans.

### Read the Span Tree

Select the root `search` span. Phoenix shows the span tree on one side and a detail pane on the other.

![Expanded Phoenix trace with search parent and qdrant_hybrid_retrieval and select_results children](/documentation/examples/trace-qdrant-hybrid-search-phoenix/phoenix-trace-detail.png)

The tree shows the parent-child order and a timing waterfall:

```text
search                     <- CHAIN, the root
|- qdrant_hybrid_retrieval <- RETRIEVER, the Qdrant call
`- select_results          <- CHAIN, the slice
```

The waterfall also shows latency. `qdrant_hybrid_retrieval` runs the dense and sparse prefetch queries and the RRF fusion. So it is usually the slowest span. `select_results` only slices a list. It has almost no latency.

### Read a Span's Attributes

Select a span to open its detail pane. Phoenix lists the attributes that the code set, and the OpenInference input and output.

Select `qdrant_hybrid_retrieval` first. Its detail pane shows a `RETRIEVER` span-kind badge and these attributes:

- `retrieval.document_ids`: IDs Qdrant returned after RRF
- `retrieval.candidate_limit`: the prefetch/fused limit sent to Qdrant
- `INPUT_VALUE`: the query text (`sports`)
- `OUTPUT_VALUE`: the full candidate payloads (JSON)

Then select `select_results`. Its detail pane shows a `CHAIN` span kind and these attributes:

- `selection.document_ids`: IDs kept after `candidates[:result_limit]`
- `selection.result_limit`: the slice limit
- `INPUT_VALUE`: the candidate list that entered selection
- `OUTPUT_VALUE`: the final result payloads (JSON)

The `INPUT_VALUE` of `select_results` must match the `OUTPUT_VALUE` of `qdrant_hybrid_retrieval`. That match links the two stages into one flow.

### See What Changed

The retrieval span shows what Qdrant found. The selection span shows what you kept. Compare the two ID lists.

Phoenix shows the full list of candidate IDs in `retrieval.document_ids`. For the `sports` query:

- `retrieval.document_ids`: up to `candidate_limit` (12) IDs in RRF order.
- `selection.document_ids`: up to `result_limit` (6) IDs. These are the first six of the fused list.

The first six IDs match across the two lists. The slice drops the rest. Now find the document you want to check:

- If it is in `retrieval.document_ids` but not in `selection.document_ids`, raise `result_limit` or add a reranker instead of a hard slice.
- If it is in neither list, raise `candidate_limit` or tune the dense/sparse queries (different embedding model, BM25 parameters, or fusion).

## Next Steps

You now have a minimal staged tracing pattern for Qdrant hybrid search. Extend it in these ways:

- Add a reranking span between retrieval and selection.
- Record scores as `retrieval.scores`.
- Wrap the inference calls in spans.

To use your own embeddings, replace `EMBEDDING_MODEL` and `SPARSE_MODEL` with any [Cloud Inference](/documentation/cloud/inference/) model or a local model. For production, export traces to a persistent Phoenix instance or any OTLP collector instead of `localhost:6006`.

If you have questions, ask on our [Discord community](https://qdrant.to/discord).
