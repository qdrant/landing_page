use qdrant_client::qdrant::{LookupLocationBuilder, QueryPointsBuilder, RecommendInputBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(
                    RecommendInputBuilder::default()
                        .add_positive(100)
                        .add_positive(231)
                        .add_negative(718)
                        .build(),
                )
                .limit(10)
                .using("image")
                .lookup_from(
                    LookupLocationBuilder::new("{external_collection_name}")
                        .vector_name("{external_vector_name}"),
                ),
        )
        .await?;

    Ok(())
}
