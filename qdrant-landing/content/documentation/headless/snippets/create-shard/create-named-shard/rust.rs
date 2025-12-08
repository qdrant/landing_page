use qdrant_client::qdrant::{
    CreateShardKeyBuilder, CreateShardKeyRequestBuilder
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .create_shard_key(
            CreateShardKeyRequestBuilder::new("{collection_name}")
                .request(CreateShardKeyBuilder::default().shard_key("{shard_key}".to_string())),
        )
        .await?;

    Ok(())
}
