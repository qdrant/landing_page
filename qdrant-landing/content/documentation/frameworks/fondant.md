---
title: ML6 Fondant
weight: 1700
aliases: [ ../integrations/fondant/ ]
---

# ML6 Fondant

[Fondant](https://fondant.ai/en/stable/) is an open-source framework that aims to simplify and speed up large-scale data processing by making containerized components reusable across pipelines and execution environments.

Fondant features a Qdrant component image to load textual data and embeddings into a the database.

## Usage

<aside role="status">
A Qdrant collection has to be <a href="documentation/concepts/collections/">created in advance</a>
</aside>

**A data load pipeline for RAG using Qdrant**.

```python
from fondant.pipeline import ComponentOp, Pipeline

pipeline = Pipeline(
    pipeline_name="ingestion-pipeline",
    pipeline_description="Pipeline to prepare and process \
    data for building a RAG solution",
    base_path="./data-dir",
)

# An example data source component
load_from_source = ComponentOp(
    component_dir="path/to/data-source-component",
    arguments={
        "n_rows_to_load": 10,
        # Custom arguments for the component
    },
)

chunk_text_op = ComponentOp.from_registry(
    name="chunk_text",
    arguments={
        "chunk_size": 512,
        "chunk_overlap": 32,
    },
)

embed_text_op = ComponentOp.from_registry(
    name="embed_text",
    arguments={
        "model_provider": "huggingface",
        "model": "all-MiniLM-L6-v2",
    },
)

# Getting the Qdrant component from the Fondant registry
index_qdrant_op = ComponentOp.from_registry(
    name="index_qdrant",
    arguments={
        "url": "http:localhost:6333",
        "collection_name": "some-collection-name",
    },
)

# Construct your pipeline
pipeline.add_op(load_from_source)
pipeline.add_op(chunk_text_op, dependencies=load_from_source)
pipeline.add_op(embed_text_op, dependencies=chunk_text_op)
pipeline.add_op(index_qdrant_op, dependencies=embed_text_op)
```

## Next steps

Find the FondantAI docs [here](https://fondant.ai/en/stable/).
