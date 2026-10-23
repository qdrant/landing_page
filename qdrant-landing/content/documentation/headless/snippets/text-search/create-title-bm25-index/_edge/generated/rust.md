```rust
use qdrant_edge::*;

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
