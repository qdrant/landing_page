use qdrant_client::qdrant::{CreateFieldIndexCollectionBuilder, FieldType};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .create_field_index(CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "location",
            FieldType::Geo,
        ))
        .await?;

    Ok(())
}
