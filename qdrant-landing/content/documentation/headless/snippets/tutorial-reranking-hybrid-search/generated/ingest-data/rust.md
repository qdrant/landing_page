```rust
let csv_url = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

let batch_size = 25;
let mut idx: u64 = 0;
let mut buffer: Vec<PointStruct> = Vec::new();

for row in parse_csv(csv_url)? {
    let row = row?;
    let title = row.title;
    let author = row.author;
    let description = row.description;

    let vectors = NamedVectors::default()
        .add_vector("dense", Document::new(&description, dense_embedding_model))
        .add_vector("sparse", Document::new(&description, sparse_embedding_model))
        .add_vector("multi", Document::new(&description, late_interaction_embedding_model));

    buffer.push(PointStruct::new(
        idx,
        vectors,
        [
            ("title", title.into()),
            ("author", author.into()),
            ("description", description.into()),
        ],
    ));
    idx += 1;

    if buffer.len() >= batch_size {
        client
            .upsert_points(UpsertPointsBuilder::new(
                collection_name,
                std::mem::take(&mut buffer),
            ))
            .await?;
    }
}

if !buffer.is_empty() {
    client
        .upsert_points(UpsertPointsBuilder::new(collection_name, buffer))
        .await?;
}
```
