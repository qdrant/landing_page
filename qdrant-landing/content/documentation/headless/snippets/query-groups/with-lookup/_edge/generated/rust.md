```rust
// Qdrant Edge doesn't support `with_lookup`, but it can be implemented as follows.
// Each Edge shard holds a single collection, so group the chunks first, then retrieve
// the matching documents from the documents shard by their group keys.
use qdrant_edge::*;
use qdrant_edge::EdgeShardRead;

let documents_shard = EdgeShard::load(std::path::Path::new("./documents"), None)?;

let groups = chunks_shard.query_groups(GroupRequest {
    query: QueryRequestBuilder::new(2)
        .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
            using: None,
        })))
        .build(),
    group_by: "document_id".try_into().unwrap(), // Path of the field to group by
    groups: 2,                                   // Max amount of groups
    group_size: 2,                               // Max amount of points per group
})?;

// Each group key is a document ID
let document_ids: Vec<PointId> = groups
    .iter()
    .filter_map(|group| serde_json::Value::from(group.key.clone()).as_u64())
    .map(PointId::NumId)
    .collect();

let documents = documents_shard.retrieve(
    RetrieveRequestBuilder::new(document_ids)
        .with_payload(WithPayloadInterface::Selector(PayloadSelector::Include(
            PayloadSelectorInclude::new(vec![
                "title".try_into().unwrap(),
                "text".try_into().unwrap(),
            ]),
        )))
        .with_vector(WithVector::Bool(false))
        .build(),
)?;
```
