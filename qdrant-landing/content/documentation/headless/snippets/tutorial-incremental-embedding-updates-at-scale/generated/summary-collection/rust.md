```rust
const META: &str = "docs-sync-digests";
const N_META: usize = N_BUCKETS / GROUP_SIZE;

if !client.collection_exists(META).await? {
    client
        .create_collection(
            CreateCollectionBuilder::new(META)
                .vectors_config(VectorParamsBuilder::new(1, Distance::Cosine)),
        )
        .await?;
}
```
