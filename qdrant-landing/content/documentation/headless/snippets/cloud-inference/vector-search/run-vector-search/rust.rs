use qdrant_client::qdrant::{Document, Fusion, PrefetchQueryBuilder, Query, QueryPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?;
    let query_text = "{query_text}";
    let dense_model = "{dense_model_name}";
    let bm25_model = "{bm25_model_name}";
    // @hide-end

    let dense_prefetch = PrefetchQueryBuilder::default()
        .query(Query::new_nearest(Document::new(query_text, dense_model)))
        .using("dense_vector")
        .build();

    let bm25_prefetch = PrefetchQueryBuilder::default()
        .query(Query::new_nearest(Document::new(query_text, bm25_model)))
        .using("bm25_sparse_vector")
        .build();

    let query_request = QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(dense_prefetch)
        .add_prefetch(bm25_prefetch)
        .query(Query::new_fusion(Fusion::Rrf))
        .with_payload(true)
        .build();

    let results = client.query(query_request).await?;

    _ = results; // @hide

    Ok(())
}
