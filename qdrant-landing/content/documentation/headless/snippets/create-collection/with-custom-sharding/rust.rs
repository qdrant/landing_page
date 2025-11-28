use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, ShardingMethod, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .create_collection(
            CreateCollectionBuilder::new("{collection_name}")
                .vectors_config(VectorParamsBuilder::new(300, Distance::Cosine))
                .shard_number(1)
                .sharding_method(ShardingMethod::Custom.into()),
        )
        .await?;

    Ok(())
}
