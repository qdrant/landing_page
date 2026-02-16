---
title: POMA
---

![POMA Logo](https://raw.githubusercontent.com/poma-ai/.github/main/assets/POMA_AI_Logo_Pink.svg)

# POMA + Qdrant: Structure-Preserving Retrieval

| Time: 15 min | Level: Beginner/Intermediate | [Complete Notebook](https://colab.research.google.com/github/poma-ai/.github/blob/main/notebooks/qdrant/poma_meets_qdrant.ipynb) | [Notebook Source](https://github.com/poma-ai/.github/blob/main/notebooks/qdrant/poma_meets_qdrant.ipynb) |
| ------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------
-------------------------------------------------------------- |

## Overview

- **POMA**, as *document chunking engine*, is built around simplicity for operators: process files into structure-aware chunksets and send them to Qdrant with minimal boilerplate and a patented chunking approach.
- **Qdrant** as your preferred  *vector search engine*.

Together, they combine individual simplicity into one streamlined workflow.

This guide walks through the current [POMA AI](https://www.poma-ai.com/) for Qdrant SDK flow: process documents, upsert chunksets, retrieve structure-preserving cheatsheets, and understand where convenience defaults end and advanced knobs begin.

---

## Short version of why teams use it:

- Better context retention: hierarchical chunksets keep section lineage attached to the source document.
- Token efficiency: retrieval is designed for high signal-per-token instead of large overlapping windows.
- Great fit for real documents: multi-format ingestion with structure-aware processing (PDFs, Office documents, scanned documents, and [much more](https://github.com/poma-ai/.github/blob/main/profile/README.md#supported-formats)).


Further details:

- [POMA docs hub](https://www.poma-ai.com/docs/)
- [POMA on GitHub](https://github.com/poma-ai)

---

## What You Will Build

A retrieval pipeline that:

1. Chunks a file with the `Poma` client.
2. Upserts chunksets into Qdrant with `PomaQdrant.upsert_poma_points(...)`.
3. Retrieves structure-preserving cheatsheets with `PomaQdrant.get_cheatsheets(...)`.

---

## Prerequisites

- Python 3.10+
- A POMA API key
- A Qdrant cluster URL + API key (for cloud)

If you need a cluster first, use Qdrant Cloud: https://cloud.qdrant.io/

[**Detailed Qdrant Cluster Setup**](https://qdrant.tech/documentation/cloud/create-cluster/#create-a-cluster)

---

## 1. Get API Keys

### POMA API key

1. Open https://app.poma-ai.com/
2. Register or sign in.
3. Open **API Keys** in the left navigation.
4. Copy your key and export it as `POMA_API_KEY`.

### Qdrant cluster API key

During Qdrant cluster creation, or when creating fine-grained API keys, see further details [here](https://qdrant.tech/documentation/cloud/authentication/).

### Credentials

Set your environment variables:

```bash
POMA_API_KEY="your_poma_api_key"
QDRANT_URL="https://<cluster>.<region>.qdrant.io"
QDRANT_API_KEY="your_qdrant_api_key"
```

---

## 2. Install Dependencies

```bash
pip install "poma[qdrant]"
```

---

## 3. Imports

```python
import os

from poma import Poma
from qdrant_client.http import models as qmodels
from poma.integrations.qdrant.qdrant_poma import PomaQdrant
```

Use your own local document path in the next step (for example `"./docs/your_file.pdf"`).
The linked Colab notebook includes downloadable sample files for quick testing.

---

## 4. Chunk a File with POMA

```python
client = Poma(os.environ["POMA_API_KEY"])

job = client.start_chunk_file("./docs/your_file.pdf")
chunk_data = client.get_chunk_result(
    job["job_id"],
    show_progress=True,
    download_dir="./",
    filename="your_file.poma",
)
```

### POMA-specific knobs in `get_chunk_result(...)`

- `show_progress`: prints job status updates while processing.
- `download_dir` + `filename`: save the returned archive as a `.poma` file while still returning parsed `chunk_data`.
- If both `download_dir` and `filename` are omitted, result is returned in-memory only (no `.poma` archive written).

`chunk_data` contains the structured output (`chunks` and `chunksets`) used by `upsert_poma_points(...)`.

If you already have a `.poma` archive, pass the path directly later:

```python
chunk_data = "your_file.poma"
```

---

## 5. Upsert Chunksets into Qdrant

```python
QDRANT_COLLECTION_NAME = "cloud_hybrid"
DENSE_MODEL = "sentence-transformers/all-minilm-l6-v2"
SPARSE_MODEL = "Qdrant/bm25"
DENSE_OPTIONS = {"dimensions": 384}

poma_qdrant = PomaQdrant(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
    cloud_inference=True,
    timeout=120,
    collection_name=QDRANT_COLLECTION_NAME,
    dense_model=DENSE_MODEL,
    sparse_model=SPARSE_MODEL,
    dense_size=384,
    dense_options=DENSE_OPTIONS,
    auto_create_collection=True,
)

poma_qdrant.upsert_poma_points(chunk_data)
```

`dense_size` is required when `auto_create_collection=True`.

---

## 6. Retrieve Structure-Preserving Cheatsheets

```python
cheatsheets = poma_qdrant.get_cheatsheets(
    query="Whats the positional embeddings frequency?",
    limit=10,
)

for i, cs in enumerate(cheatsheets, 1):
    print(f"\n=== Cheatsheet {i} ===")
    print(f"file_id: {cs['file_id']}")
    print("content:")
    print(cs["content"])
```

---

## 7. Advanced Query Control (Optional)

Use Qdrant prefetch + RRF fusion explicitly and still return POMA cheatsheets.

```python
query_text = "Whats the positional embeddings frequency?"

query_obj = qmodels.RrfQuery(rrf=qmodels.Rrf(k=60))
prefetch = [
    qmodels.Prefetch(
        query=qmodels.Document(
            text=query_text,
            model=DENSE_MODEL,
            options=DENSE_OPTIONS,
        ),
        using="dense",
        limit=100,
    ),
    qmodels.Prefetch(
        query=qmodels.Document(
            text=query_text,
            model=SPARSE_MODEL,
        ),
        using="sparse",
        limit=100,
    ),
]

cheatsheets = poma_qdrant.get_cheatsheets(
    query_obj=query_obj,
    prefetch=prefetch,
    collection_name=QDRANT_COLLECTION_NAME,
    limit=10,
    chunk_data=chunk_data,
)
```

---

## FAQ

If you have a question, suggestion, or found something unclear in this readme, please reach out to us:  
**sdk@poma-ai.com**

Your feedback will help us expand this section into a valuable reference for everyone.

---

## Notes

- `PomaQdrant` is a `QdrantClient` subclass, so existing Qdrant workflows still apply.
- Whith convenience defaults for faster setup, we provide preconfigured parameters that the integration applies automatically, so you can start quickly without setting every parameter manually in later steps:
  - one dense vector field (`dense`, configurable via `dense_name`)
  - one optional sparse vector field (`sparse`, configurable via `sparse_name`)
  - automatic hybrid retrieval (`query="..."`) with dense + sparse prefetch and RRF when `sparse_model` is enabled
- Collection convenience:
  - set `auto_create_collection=True` to create the collection automatically
  - when auto-create is enabled, `dense_size` is required
- Full control via passthrough `kwargs`:
  - `upsert_poma_points(..., **kwargs)` forwards to `upsert(...)`
  - `get_cheatsheets(..., **kwargs)` forwards to `query_points(...)`
  - when the same key is set in both convenience args and `kwargs`, `kwargs` wins
- Full query orchestration:
  - use `get_cheatsheets(query_obj=..., prefetch=...)` for explicit Qdrant query composition
  - or run raw methods (`create_collection`, `upsert`/`upload_points`, `query_points`, etc.) and convert with `get_cheatsheets(results=...)`
- For self-hosted/local Qdrant, use `location=":memory:"` or `path="./.qdrant_data"` and omit `api_key`.
