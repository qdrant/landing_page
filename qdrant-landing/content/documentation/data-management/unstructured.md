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
pip install "unstructured-ingest[qdrant]"
```

## Usage


Depending on the use case you can prefer the command line or using it within your application.

### CLI

```bash
unstructured-ingest \
  local \
    --input-path $LOCAL_FILE_INPUT_DIR \
    --chunking-strategy by_title \
    --embedding-provider huggingface \
    --partition-by-api \
    --api-key $UNSTRUCTURED_API_KEY \
    --partition-endpoint $UNSTRUCTURED_API_URL \
    --additional-partition-args="{\"split_pdf_page\":\"true\", \"split_pdf_allow_failed\":\"true\", \"split_pdf_concurrency_level\": 15}" \
  qdrant-cloud \
    --url $QDRANT_URL \
    --api-key $QDRANT_API_KEY \
    --collection-name $QDRANT_COLLECTION \
    --batch-size 50 \
    --num-processes 1
```

For a full list of the options the CLI accepts, run `unstructured-ingest <upstream connector> qdrant --help`

### Programmatic usage

```python
import os

from unstructured_ingest.pipeline.pipeline import Pipeline
from unstructured_ingest.interfaces import ProcessorConfig

from unstructured_ingest.processes.connectors.local import (
    LocalIndexerConfig,
    LocalDownloaderConfig,
    LocalConnectionConfig
)
from unstructured_ingest.processes.partitioner import PartitionerConfig
from unstructured_ingest.processes.chunker import ChunkerConfig
from unstructured_ingest.processes.embedder import EmbedderConfig

from unstructured_ingest.processes.connectors.qdrant.cloud import (
    CloudQdrantConnectionConfig,
    CloudQdrantAccessConfig,
    CloudQdrantUploadStagerConfig,
    CloudQdrantUploaderConfig
)

if __name__ == "__main__":
    Pipeline.from_configs(
        context=ProcessorConfig(),
        indexer_config=LocalIndexerConfig(input_path=os.getenv("LOCAL_FILE_INPUT_DIR")),
        downloader_config=LocalDownloaderConfig(),
        source_connection_config=LocalConnectionConfig(),
        partitioner_config=PartitionerConfig(
            partition_by_api=True,
            api_key=os.getenv("UNSTRUCTURED_API_KEY"),
            partition_endpoint=os.getenv("UNSTRUCTURED_API_URL"),
            additional_partition_args={
                "split_pdf_page": True,
                "split_pdf_allow_failed": True,
                "split_pdf_concurrency_level": 15
            }
        ),
        chunker_config=ChunkerConfig(chunking_strategy="by_title"),
        embedder_config=EmbedderConfig(embedding_provider="huggingface"),

        destination_connection_config=CloudQdrantConnectionConfig(
            access_config=CloudQdrantAccessConfig(
                api_key=os.getenv("QDRANT_API_KEY")
            ),
            url=os.getenv("QDRANT_URL")
        ),
        stager_config=CloudQdrantUploadStagerConfig(),
        uploader_config=CloudQdrantUploaderConfig(
            collection_name=os.getenv("QDRANT_COLLECTION"),
            batch_size=50,
            num_processes=1
        )
    ).run()
```

## Next steps

- Unstructured API [reference](https://unstructured-io.github.io/unstructured/api.html).
- Qdrant ingestion destination [reference](https://docs.unstructured.io/ui/destinations/qdrant).
- [Source Code](https://github.com/Unstructured-IO/unstructured-ingest/tree/main/unstructured_ingest/processes/connectors/qdrant)
