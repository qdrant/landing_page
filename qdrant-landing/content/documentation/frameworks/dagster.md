---
title: Dagster
---

# Dagster

[Dagster](https://dagster.io) is a Python framework for data orchestration built for data engineers, with integrated lineage, observability, a declarative programming model, and best-in-class testability.

The `dagster-qdrant` library lets you integrate Qdrant's vector database with Dagster, making it easy to build AI-driven data pipelines. You can run vector searches and manage data directly within Dagster.

### Installation

```bash
pip install dagster dagster-qdrant
```

### Example

```py
from dagster_qdrant import QdrantConfig, QdrantResource

import dagster as dg


@dg.asset
def my_table(qdrant_resource: QdrantResource):
    with qdrant_resource.get_client() as qdrant:
        qdrant.add(
            collection_name="test_collection",
            documents=[
                "This is a document about oranges",
                "This is a document about pineapples",
                "This is a document about strawberries",
                "This is a document about cucumbers",
            ],
        )
        results = qdrant.query(
            collection_name="test_collection", query_text="hawaii", limit=3
        )


defs = dg.Definitions(
    assets=[my_table],
    resources={
        "qdrant_resource": QdrantResource(
            config=QdrantConfig(
                host="xyz-example.eu-central.aws.cloud.qdrant.io",
                api_key="<your-api-key>",
            )
        )
    },
)
```

## Next steps

- Dagster [documentation](https://docs.dagster.io)

- Dagster [examples](https://github.com/dagster-io/dagster/tree/b985d57aadc7d9bf88d8dcbd32b16d3487e433cc/examples)
