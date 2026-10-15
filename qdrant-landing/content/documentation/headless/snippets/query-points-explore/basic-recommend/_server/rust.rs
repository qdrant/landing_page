use qdrant_client::qdrant::{
    Condition, Filter, QueryPointsBuilder, RecommendInputBuilder, RecommendStrategy,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide
    
    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(
                    RecommendInputBuilder::default()
                        .add_positive(100)
                        .add_positive(231)
                        .add_negative(718)
                        .add_negative(vec![0.2, 0.3, 0.4, 0.5])
                        .strategy(RecommendStrategy::AverageVector)
                        .build(),
                )
                .limit(3)
                .filter(Filter::must([Condition::matches(
                    "city",
                    "London".to_string(),
                )])),
        )
        .await?;

    Ok(())
}
