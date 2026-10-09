use std::collections::HashMap;

use anyhow::Context;
use qdrant_edge::external::ordered_float::OrderedFloat;
use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    // Look up the stored vectors of the feedback examples
    let records = edge_shard.retrieve(
        RetrieveRequestBuilder::new([111, 222, 333].map(PointId::from).to_vec())
            .with_payload(WithPayloadInterface::Bool(false))
            .with_vector(WithVector::Bool(true))
            .build(),
    )?;
    let mut vectors: HashMap<PointId, VectorInternal> = HashMap::new();
    for record in &records {
        let vector = record
            .get_vector_by_name(DEFAULT_VECTOR_NAME)
            .context("point has no vector")?;
        vectors.insert(record.id, vector.to_owned());
    }
    let mut take = |id: u64| vectors.remove(&PointId::from(id)).context("point not found");

    let _points = edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Vector(QueryEnum::FeedbackNaive(NamedQuery {
                query: FeedbackNaiveQuery {
                    target: vec![0.1f32, 0.9, 0.23].into(),
                    feedback: vec![
                        FeedbackItem {
                            vector: take(111)?,
                            score: OrderedFloat(0.68),
                        },
                        FeedbackItem {
                            vector: take(222)?,
                            score: OrderedFloat(0.72),
                        },
                        FeedbackItem {
                            vector: take(333)?,
                            score: OrderedFloat(0.61),
                        },
                    ],
                    coefficients: NaiveFeedbackStrategy {
                        a: OrderedFloat(0.12),
                        b: OrderedFloat(0.43),
                        c: OrderedFloat(0.03),
                    },
                },
                using: None,
            })))
            .build(),
    )?;

    Ok(())
}
