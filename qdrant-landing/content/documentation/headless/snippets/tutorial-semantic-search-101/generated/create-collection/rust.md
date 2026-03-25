```rust
let collection_name = "my_books";

client
    .create_collection(
        CreateCollectionBuilder::new(collection_name)
            .vectors_config(VectorParamsBuilder::new(384, Distance::Cosine)), // Vector size is defined by used model
    )
    .await?;
```
