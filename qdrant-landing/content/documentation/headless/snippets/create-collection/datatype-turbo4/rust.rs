use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Datatype, Distance, VectorParamsBuilder,
};

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

    client
        .create_collection(
            CreateCollectionBuilder::new("{collection_name}").vectors_config(
                VectorParamsBuilder::new(1024, Distance::Cosine).datatype(Datatype::Turbo4),
            ),
        )
        .await?;

    Ok(())
}
