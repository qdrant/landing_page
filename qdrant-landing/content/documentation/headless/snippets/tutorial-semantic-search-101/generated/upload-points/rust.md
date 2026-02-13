```rust
let embedding_model = "sentence-transformers/all-minilm-l6-v2";

let points: Vec<PointStruct> = documents
    .iter()
    .enumerate()
    .map(|(idx, (name, description, author, year))| {
        PointStruct::new(
            idx as u64,
            Document::new(*description, embedding_model),
            [
                ("name", (*name).into()),
                ("description", (*description).into()),
                ("author", (*author).into()),
                ("year", (*year).into()),
            ],
        )
    })
    .collect();

client
    .upsert_points(UpsertPointsBuilder::new(collection_name, points))
    .await?;
```
