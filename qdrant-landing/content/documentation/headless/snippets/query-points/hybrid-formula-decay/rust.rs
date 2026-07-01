use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    DecayParamsExpressionBuilder, Expression, FormulaBuilder, PrefetchQueryBuilder, Query,
    QueryPointsBuilder, RrfBuilder,
};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client.query(
        QueryPointsBuilder::new("{collection_name}")
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .add_prefetch(
                        PrefetchQueryBuilder::default()
                            .query(Query::new_nearest([(1, 0.22), (42, 0.8)].as_slice()))
                            .using("sparse")
                            .limit(100u64),
                    )
                    .add_prefetch(
                        PrefetchQueryBuilder::default()
                            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
                            .using("dense")
                            .limit(100u64),
                    )
                    .query(Query::new_rrf(RrfBuilder::default()))
                    .limit(100u64),
            )
            .query(
                FormulaBuilder::new(Expression::sum_with([
                    Expression::score(),
                    Expression::mult_with([
                        Expression::constant(0.1),
                        Expression::exp_decay(
                            DecayParamsExpressionBuilder::new(Expression::datetime_key("published_at"))
                                .target(Expression::datetime("YYYY-MM-DDT00:00:00Z"))
                                .scale(86400.0 * 180.0)
                                .midpoint(0.5),
                        ),
                    ]),
                ])),
            )
            .limit(10u64),
    )
    .await?;

    Ok(())
}
