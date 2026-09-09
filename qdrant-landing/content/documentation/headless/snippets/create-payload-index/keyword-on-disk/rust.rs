use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    KeywordIndexParamsBuilder,
    FieldType,
    Memory
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

    client.create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "payload_field_name",
            FieldType::Keyword,
        )
        .field_index_params(
            KeywordIndexParamsBuilder::default()
                .memory(Memory::Cold),
        ),
    ).await?;

    Ok(())
}
