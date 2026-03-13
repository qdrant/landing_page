```rust
use qdrant_client::qdrant::{
    Condition, CreateCollectionBuilder, CreateFieldIndexCollectionBuilder, Distance, Document,
    FieldType, Filter, PointStruct, Query, QueryPointsBuilder, Range, UpsertPointsBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url(QDRANT_URL)
    .api_key(QDRANT_API_KEY)
    .build()?;

let collection_name = "my_books";

client
    .create_collection(
        CreateCollectionBuilder::new(collection_name)
            .vectors_config(VectorParamsBuilder::new(384, Distance::Cosine)), // Vector size is defined by used model
    )
    .await?;

let documents = [
    ("The Time Machine", "A man travels through time and witnesses the evolution of humanity.", "H.G. Wells", 1895),
    ("Ender's Game", "A young boy is trained to become a military leader in a war against an alien race.", "Orson Scott Card", 1985),
    ("Brave New World", "A dystopian society where people are genetically engineered and conditioned to conform to a strict social hierarchy.", "Aldous Huxley", 1932),
    ("The Hitchhiker's Guide to the Galaxy", "A comedic science fiction series following the misadventures of an unwitting human and his alien friend.", "Douglas Adams", 1979),
    ("Dune", "A desert planet is the site of political intrigue and power struggles.", "Frank Herbert", 1965),
    ("Foundation", "A mathematician develops a science to predict the future of humanity and works to save civilization from collapse.", "Isaac Asimov", 1951),
    ("Snow Crash", "A futuristic world where the internet has evolved into a virtual reality metaverse.", "Neal Stephenson", 1992),
    ("Neuromancer", "A hacker is hired to pull off a near-impossible hack and gets pulled into a web of intrigue.", "William Gibson", 1984),
    ("The War of the Worlds", "A Martian invasion of Earth throws humanity into chaos.", "H.G. Wells", 1898),
    ("The Hunger Games", "A dystopian society where teenagers are forced to fight to the death in a televised spectacle.", "Suzanne Collins", 2008),
    ("The Andromeda Strain", "A deadly virus from outer space threatens to wipe out humanity.", "Michael Crichton", 1969),
    ("The Left Hand of Darkness", "A human ambassador is sent to a planet where the inhabitants are genderless and can change gender at will.", "Ursula K. Le Guin", 1969),
    ("The Three-Body Problem", "Humans encounter an alien civilization that lives in a dying system.", "Liu Cixin", 2008),
];

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

let query_result = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(
                "alien invasion",
                embedding_model,
            )))
            .limit(3)
            .with_payload(true),
    )
    .await?;

for hit in query_result.result {
    println!("{:?} score: {}", hit.payload, hit.score);
}

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(collection_name, "year", FieldType::Integer)
            .wait(true),
    )
    .await?;

let query_result_filtered = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(
                "alien invasion",
                embedding_model,
            )))
            .filter(Filter::must([Condition::range(
                "year",
                Range {
                    gte: Some(2000.0),
                    ..Default::default()
                },
            )]))
            .limit(1)
            .with_payload(true),
    )
    .await?;

for hit in query_result_filtered.result {
    println!("{:?} score: {}", hit.payload, hit.score);
}
```
