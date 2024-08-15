---
title: Fondant
aliases: [ ../integrations/fondant/, ../frameworks/fondant/ ]
---

# Fondant

[Fondant](https://fondant.ai/en/stable/) is an open-source framework that aims to simplify and speed
up large-scale data processing by making containerized components reusable across pipelines and
execution environments. Benefit from built-in features such as autoscaling, data lineage, and
pipeline caching, and deploy to (managed) platforms such as Vertex AI, Sagemaker, and Kubeflow
Pipelines.

Fondant comes with a library of reusable components that you can leverage to compose your own
pipeline, including a Qdrant component for writing embeddings to Qdrant.

## Usage

<aside role="status">
A Qdrant collection has to be <a href="/documentation/concepts/collections/">created in advance</a>
</aside>

**A data load pipeline for RAG using Qdrant**.

A simple ingestion pipeline could look like the following:

```python
import pyarrow as pa
from fondant.pipeline import Pipeline

indexing_pipeline = Pipeline(
    name="ingestion-pipeline",
    description="Pipeline to prepare and process data for building a RAG solution",
    base_path="./fondant-artifacts",
)

# An custom implemenation of a read component. 
text = indexing_pipeline.read(
    "path/to/data-source-component",
    arguments={
        # your custom arguments 
    }
)

chunks = text.apply(
    "chunk_text",
    arguments={
        "chunk_size": 512,
        "chunk_overlap": 32,
    },
)

embeddings = chunks.apply(
    "embed_text",
    arguments={
        "model_provider": "huggingface",
        "model": "all-MiniLM-L6-v2",
    },
)

embeddings.write(
    "index_qdrant",
    arguments={
        "url": "http:localhost:6333",
        "collection_name": "some-collection-name",
    },
    cache=False,
)
```

Once you have a pipeline, you can easily run it using the built-in CLI. Fondant allows
you to run the pipeline in production across different clouds.

The first component is a custom read module that needs to be implemented and cannot be used off the
shelf. A detailed tutorial on how to rebuild this
pipeline [is provided on GitHub](https://github.com/ml6team/fondant-usecase-RAG/tree/main).

## Next steps

More information about creating your own pipelines and components can be found in the [Fondant
documentation](https://fondant.ai/en/stable/).
