use qdrant_client::qdrant::{CreateFieldIndexCollectionBuilder, FieldType};

pub async fn main() -> anyhow::Result<()> {
    client
        .create_field_index(
            CreateFieldIndexCollectionBuilder::new(
                "{collection_name}",
                "name_of_the_field_to_index",
                FieldType::Keyword,
            )
            .wait(true),
        )
        .await?;

    Ok(())
}
