use qdrant_client::qdrant::{
    Expression, FormulaBuilder, PrefetchQueryBuilder, QueryPointsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    let _best_match = client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .add_prefetch(
                    PrefetchQueryBuilder::default()
                        .query(vec![0.01, 0.45, 0.67])
                        .using("title")
                        .limit(50u64),
                )
                .add_prefetch(
                    PrefetchQueryBuilder::default()
                        .query(vec![0.01, 0.45, 0.67])
                        .using("summary")
                        .limit(50u64),
                )
                .query(
                    FormulaBuilder::new(Expression::max_with([
                        Expression::variable("$score[0]"),
                        Expression::variable("$score[1]"),
                    ]))
                    // used when a point is missing from the second prefetch
                    .add_default("$score[1]", -1e30),
                )
                .limit(10),
        )
        .await?;

    Ok(())
}
