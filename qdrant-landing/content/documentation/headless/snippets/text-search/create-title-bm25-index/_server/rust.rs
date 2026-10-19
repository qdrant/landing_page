use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder, FieldType, TextIndexParamsBuilder, TokenizerType,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .create_field_index(
            CreateFieldIndexCollectionBuilder::new("books", "title", FieldType::Text)
                .field_index_params(
                    TextIndexParamsBuilder::new(TokenizerType::Word)
                        .bm25_scoring()
                        .build(),
                ),
        )
        .await?;

    Ok(())
}
