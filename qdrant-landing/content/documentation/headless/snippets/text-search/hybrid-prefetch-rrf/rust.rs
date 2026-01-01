use qdrant_client::qdrant::{Document, Fusion, PrefetchQueryBuilder, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let dense_prefetch = PrefetchQueryBuilder::default()
        .query(Query::new_nearest(Document::new(
            "9780553213515",
            "sentence-transformers/all-minilm-l6-v2",
        )))
        .using("description-dense")
        .score_threshold(0.5)
        .build();

    let bm25_prefetch = PrefetchQueryBuilder::default()
        .query(Query::new_nearest(Document::new(
            "9780553213515",
            "Qdrant/bm25",
        )))
        .using("isbn-bm25")
        .build();

    client
        .query(
            QueryPointsBuilder::new("books")
                .add_prefetch(dense_prefetch)
                .add_prefetch(bm25_prefetch)
                .query(Query::new_fusion(Fusion::Rrf))
                .limit(10)
                .with_payload(true)
                .build(),
        )
        .await?;

    Ok(())
}
