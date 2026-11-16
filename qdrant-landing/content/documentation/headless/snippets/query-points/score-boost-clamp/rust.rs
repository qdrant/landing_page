use qdrant_client::qdrant::{
    Expression, FormulaBuilder, PrefetchQueryBuilder, QueryPointsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    let _clamped = client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .add_prefetch(
                    PrefetchQueryBuilder::default()
                        .query(vec![0.01, 0.45, 0.67])
                        .limit(100u64),
                )
                .query(FormulaBuilder::new(Expression::sum_with([
                    Expression::score(),
                    // clamp `rating` into the range [0, 1]
                    Expression::max_with([
                        Expression::constant(0.0),
                        Expression::min_with([
                            Expression::constant(1.0),
                            Expression::variable("rating"),
                        ]),
                    ]),
                ])))
                .limit(10),
        )
        .await?;

    Ok(())
}
