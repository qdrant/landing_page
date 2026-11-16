```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, CreateFieldIndexCollectionBuilder, Distance, Document, FieldType,
    Fusion, HnswConfigDiffBuilder, MultiVectorComparator, MultiVectorConfigBuilder, NamedVectors,
    PointStruct, PrefetchQueryBuilder, Query, QueryPointsBuilder, TextIndexParamsBuilder,
    TokenizerType, UpsertPointsBuilder, VectorParamsBuilder, VectorsConfigBuilder,
};

let client = Qdrant::from_url(qdrant_url)
    .api_key(qdrant_api_key)
    .build()?;

let dense_embedding_model = "sentence-transformers/all-MiniLM-L6-v2";
let late_interaction_embedding_model = "answerdotai/answerai-colbert-small-v1";

let collection_name = "hybrid-search";

if client.collection_exists(collection_name).await? {
    client.delete_collection(collection_name).await?;
}

let mut vectors = VectorsConfigBuilder::default();
vectors.add_named_vector_params(
    "dense",
    VectorParamsBuilder::new(384, Distance::Cosine),
);
vectors.add_named_vector_params(
    "multi",
    VectorParamsBuilder::new(96, Distance::Cosine)
        .multivector_config(MultiVectorConfigBuilder::new(MultiVectorComparator::MaxSim))
        .hnsw_config(HnswConfigDiffBuilder::default().m(0)), // Disable HNSW for reranking
);

client
    .create_collection(CreateCollectionBuilder::new(collection_name).vectors_config(vectors))
    .await?;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(collection_name, "description", FieldType::Text)
            .field_index_params(
                TextIndexParamsBuilder::new(TokenizerType::Word)
                    .snowball_stemmer("english".to_string())
                    .stopwords_language("english".to_string())
                    .bm25_scoring() // Enable BM25 scoring
                    .build(),
            ),
    )
    .await?;

struct CsvRow {
    title: String,
    author: String,
    description: String,
}

fn parse_csv(url: &str) -> anyhow::Result<impl Iterator<Item = anyhow::Result<CsvRow>>> {
    let reader = ureq::get(url).call()?.into_body().into_reader();
    let mut rdr = csv::Reader::from_reader(reader);
    let headers = rdr.headers()?.clone();
    let title_idx = headers.iter().position(|h| h == "Title").unwrap();
    let author_idx = headers.iter().position(|h| h == "Author").unwrap();
    let description_idx = headers.iter().position(|h| h == "Description").unwrap();
    let iter = rdr.into_records().map(move |result| {
        let record = result?;
        Ok(CsvRow {
            title: record[title_idx].to_string(),
            author: record[author_idx].to_string(),
            description: record[description_idx].to_string(),
        })
    });
    Ok(iter)
}

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

let query = "time travel";

let results = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(query, dense_embedding_model)))
            .using("dense")
            .limit(10),
    )
    .await?;

for result in results.result {
    println!("{:?}", result);
}

let results = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_text(query))
            .using("description")
            .limit(10),
    )
    .await?;

for result in results.result {
    println!("{:?}", result);
}

let results = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(Document::new(query, dense_embedding_model)))
                    .using("dense")
                    .limit(20u64),
            )
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_text(query))
                    .using("description")
                    .limit(20u64),
            )
            .query(Query::new_fusion(Fusion::Rrf))
            .with_payload(true)
            .limit(10),
    )
    .await?;

for result in results.result {
    println!("{:?}", result);
}

let results = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(Document::new(query, dense_embedding_model)))
                    .using("dense")
                    .limit(20u64),
            )
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_text(query))
                    .using("description")
                    .limit(20u64),
            )
            .query(Query::new_nearest(Document::new(query, late_interaction_embedding_model)))
            .using("multi")
            .with_payload(true)
            .limit(10),
    )
    .await?;

for result in results.result {
    println!("{:?}", result);
}
```
