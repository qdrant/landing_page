use qdrant_client::qdrant::{Condition, Filter, SearchMatrixPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    client
        .search_matrix_pairs(
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
