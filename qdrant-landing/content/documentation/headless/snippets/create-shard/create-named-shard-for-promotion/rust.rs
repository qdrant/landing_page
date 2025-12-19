use qdrant_client::qdrant::{
    CreateShardKeyBuilder, CreateShardKeyRequestBuilder
};
use qdrant_client::qdrant::ReplicaState;
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .create_shard_key(
            CreateShardKeyRequestBuilder::new("{collection_name}")
                .request(
                    CreateShardKeyBuilder::default()
                        .shard_key("user_1".to_string())
                        .initial_state(ReplicaState::Partial)
                ),
        )
        .await?;

    Ok(())
}
