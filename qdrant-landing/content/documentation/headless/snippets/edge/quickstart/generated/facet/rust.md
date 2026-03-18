```rust
let facet_response = edge_shard.facet(FacetRequest {
    key: "color".try_into().unwrap(),
    limit: 10,
    filter: None,
    exact: false,
})?;
```
