```rust
let facet_response = edge_shard.facet(FacetRequestInternal {
    key: "color".try_into().unwrap(),
    limit: 10,
    filter: None,
    exact: false,
})?;
```
