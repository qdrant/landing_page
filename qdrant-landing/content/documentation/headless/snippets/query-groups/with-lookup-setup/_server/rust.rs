use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, CreateFieldIndexCollectionBuilder, Distance, FieldType,
    VectorParamsBuilder, VectorsConfigBuilder,
};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .create_collection(
            CreateCollectionBuilder::new("chunks")
                .vectors_config(VectorParamsBuilder::new(4, Distance::Cosine)),
        )
        .await?;

    client
        .create_field_index(
            CreateFieldIndexCollectionBuilder::new("chunks", "document_id", FieldType::Integer)
                .wait(true),
        )
        .await?;

    // No vectors, payload only.
    client
        .create_collection(
            CreateCollectionBuilder::new("documents")
                .vectors_config(VectorsConfigBuilder::default()),
        )
        .await?;

    Ok(())
}
