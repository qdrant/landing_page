use qdrant_client::qdrant::{Condition, Filter, SearchMatrixPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .search_matrix_offsets(
            SearchMatrixPointsBuilder::new("collection_name")
               .filter(Filter::must(vec![Condition::matches(
                   "color",
                   "red".to_string(),
               )]))
               .sample(10)
               .limit(2),
        )
        .await?;

    Ok(())
}
