```rust
use std::path::Path;

use qdrant_edge::*;

let config = EdgeConfigBuilder::new()
    .vector(
        "description-dense",
        EdgeVectorParamsBuilder::new(384, Distance::Cosine).build(),
    )
    .build();

let edge_shard = EdgeShard::new(Path::new("./shard"), config)?;

edge_shard.update(UpdateOperation::FieldIndexOperation(
    FieldIndexOperations::CreateIndex(CreateIndex {
        field_name: "title".try_into().unwrap(),
        field_schema: Some(PayloadFieldSchema::FieldParams(PayloadSchemaParams::Text(
            TextIndexParamsBuilder::new()
                .scoring(TextScoringParams::default())
                .build(),
        ))),
    }),
))?;
```
