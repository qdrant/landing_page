```rust
use qdrant_edge::*;

edge_shard.update(UpdateOperation::FieldIndexOperation(
    FieldIndexOperations::CreateIndex(CreateIndex {
        field_name: "color".try_into().unwrap(),
        field_schema: Some(PayloadFieldSchema::FieldType(
            PayloadSchemaType::Keyword,
        )),
    }),
))?;
```
