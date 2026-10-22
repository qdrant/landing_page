use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    TextIndexParamsBuilder,
    TextScoringType,
    FieldType,
    TokenizerType,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let text_index_params = TextIndexParamsBuilder::new(TokenizerType::Word)
        .lowercase(true)
        .scoring(TextScoringType::Bm25);

    client
        .create_field_index(
            CreateFieldIndexCollectionBuilder::new(
                "{collection_name}",
                "name_of_the_field_to_index",
                FieldType::Text,
            ).field_index_params(text_index_params.build()),
        )
        .await?;

    Ok(())
}
