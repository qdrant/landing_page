use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder, FieldType, FloatIndexParamsBuilder,
    KeywordIndexParamsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

    client
        .create_field_index(
            CreateFieldIndexCollectionBuilder::new(
                "{collection_name}",
                "offers[].shop",
                FieldType::Keyword,
            )
            .field_index_params(KeywordIndexParamsBuilder::default().nested("offers")),
        )
        .await?;

    client
        .create_field_index(
            CreateFieldIndexCollectionBuilder::new(
                "{collection_name}",
                "offers[].price",
                FieldType::Float,
            )
            .field_index_params(FloatIndexParamsBuilder::default().nested("offers")),
        )
        .await?;

    Ok(())
}
