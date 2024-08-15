---
title: Unstructured
aliases: [ ../frameworks/unstructured/ ]
---

# Unstructured

[Unstructured](https://unstructured.io/) is a library designed to help preprocess, structure unstructured text documents for downstream machine learning tasks.

Qdrant can be used as an ingestion destination in Unstructured.

## Setup

Install Unstructured with the `qdrant` extra.

```bash
pip install "unstructured[qdrant]"
```

## Usage


Depending on the use case you can prefer the command line or using it within your application.

### CLI

```bash
EMBEDDING_PROVIDER=${EMBEDDING_PROVIDER:-"langchain-huggingface"}

unstructured-ingest \
  local \
  --input-path example-docs/book-war-and-peace-1225p.txt \
  --output-dir local-output-to-qdrant \
  --strategy fast \
  --chunk-elements \
  --embedding-provider "$EMBEDDING_PROVIDER" \
  --num-processes 2 \
  --verbose \
  qdrant \
  --collection-name "test" \
  --url "http://localhost:6333" \
  --batch-size 80
```

For a full list of the options the CLI accepts, run `unstructured-ingest <upstream connector> qdrant --help`

### Programmatic usage

```python
from unstructured.ingest.connector.local import SimpleLocalConfig
from unstructured.ingest.connector.qdrant import (
    QdrantWriteConfig,
    SimpleQdrantConfig,
)
from unstructured.ingest.interfaces import (
    ChunkingConfig,
    EmbeddingConfig,
    PartitionConfig,
    ProcessorConfig,
    ReadConfig,
)
from unstructured.ingest.runner import LocalRunner
from unstructured.ingest.runner.writers.base_writer import Writer
from unstructured.ingest.runner.writers.qdrant import QdrantWriter

def get_writer() -> Writer:
    return QdrantWriter(
        connector_config=SimpleQdrantConfig(
            url="http://localhost:6333",
            collection_name="test",
        ),
        write_config=QdrantWriteConfig(batch_size=80),
    )

if __name__ == "__main__":
    writer = get_writer()
    runner = LocalRunner(
        processor_config=ProcessorConfig(
            verbose=True,
            output_dir="local-output-to-qdrant",
            num_processes=2,
        ),
        connector_config=SimpleLocalConfig(
            input_path="example-docs/book-war-and-peace-1225p.txt",
        ),
        read_config=ReadConfig(),
        partition_config=PartitionConfig(),
        chunking_config=ChunkingConfig(chunk_elements=True),
        embedding_config=EmbeddingConfig(provider="langchain-huggingface"),
        writer=writer,
        writer_kwargs={},
    )
    runner.run()
```

## Next steps

- Unstructured API [reference](https://unstructured-io.github.io/unstructured/api.html).
- Qdrant ingestion destination [reference](https://unstructured-io.github.io/unstructured/ingest/destination_connectors/qdrant.html).
- [Source Code](https://github.com/Unstructured-IO/unstructured/blob/main/unstructured/ingest/connector/qdrant.py)
