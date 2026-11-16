use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Query, QueryPointsBuilder, TextQueryBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .query(
            QueryPointsBuilder::new("books")
                .query(Query::new_text(
                    TextQueryBuilder::new("time travel").k(1.5).b(0.5),
                ))
                .using("title")
                .limit(10)
                .with_payload(true)
                .build(),
        )
        .await?;

    Ok(())
}
