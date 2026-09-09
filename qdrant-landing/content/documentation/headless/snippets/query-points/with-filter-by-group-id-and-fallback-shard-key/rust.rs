use qdrant_client::qdrant::{Condition, Filter, QueryPointsBuilder, ShardKeySelectorBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let shard_key_selector = ShardKeySelectorBuilder::with_shard_key("user_1")
        .fallback("default")
        .build();

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(vec![0.1, 0.1, 0.9])
                .limit(10)
                .filter(Filter::must([Condition::matches(
                    "group_id",
                    "user_1".to_string(),
                )]))
                .shard_key_selector(shard_key_selector),
        )
        .await?;

    Ok(())
}
