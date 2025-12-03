use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    KeywordIndexParamsBuilder,
    FieldType
};

use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client.create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "payload_field_name",
            FieldType::Keyword,
        )
        .field_index_params(
            KeywordIndexParamsBuilder::default()
                .is_tenant(true),
        ),
    ).await?;

    Ok(())
}
