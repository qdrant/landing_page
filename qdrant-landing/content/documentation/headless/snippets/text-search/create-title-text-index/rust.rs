use qdrant_client::qdrant::{CreateFieldIndexCollectionBuilder, FieldType, TextIndexParamsBuilder, TokenizerType};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> { // @hide
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let params = TextIndexParamsBuilder::new(TokenizerType::Word)
        .ascii_folding(true)
        .lowercase(true)
        .build();

    client
        .create_field_index(
            CreateFieldIndexCollectionBuilder::new("books", "title", FieldType::Text)
                .field_index_params(params),
        )
        .await?;

    Ok(())
} // @hide
