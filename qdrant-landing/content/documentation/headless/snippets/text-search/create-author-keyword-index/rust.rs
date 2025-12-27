use qdrant_client::qdrant::{CreateFieldIndexCollectionBuilder, FieldType};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .create_field_index(CreateFieldIndexCollectionBuilder::new(
            "books",
            "author",
            FieldType::Keyword,
        ))
        .await?;

    Ok(())
}
