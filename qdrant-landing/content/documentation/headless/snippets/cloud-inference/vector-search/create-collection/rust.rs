use qdrant_client::qdrant::{
    CreateCollectionBuilder, CreateFieldIndexCollectionBuilder, Distance, FieldType,
    TextIndexParamsBuilder, TokenizerType, VectorParamsBuilder, VectorsConfigBuilder,
};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let mut vector_config = VectorsConfigBuilder::default();
    vector_config.add_named_vector_params(
        "dense_vector",
        VectorParamsBuilder::new(384, Distance::Cosine),
    );

    client
        .create_collection(
            CreateCollectionBuilder::new("{collection_name}").vectors_config(vector_config),
        )
        .await?;

    client
        .create_field_index(
            CreateFieldIndexCollectionBuilder::new(
                "{collection_name}",
                "passage_text",
                FieldType::Text,
            )
            .field_index_params(
                TextIndexParamsBuilder::new(TokenizerType::Word)
                    .bm25_scoring() // Enable BM25 scoring
                    .build(),
            ),
        )
        .await?;

    Ok(())
}
