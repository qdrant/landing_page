```rust
let csv_url = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

let batch_size = 25;
let mut idx: u64 = 0;
let mut buffer: Vec<PointStruct> = Vec::new();

let bytes = reqwest::get(csv_url).await?.bytes().await?;
let mut rdr = csv::Reader::from_reader(bytes.as_ref());

for result in rdr.records() {
    let record = result?;
    let title = record[0].to_string();
    let author = record[1].to_string();
    let description = record[3].to_string();

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
