use std::collections::HashMap;

use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let response = edge_shard.search_matrix(
        SearchMatrixRequestBuilder::new(10, 2, DEFAULT_VECTOR_NAME.to_string())
            .filter(Filter::new_must(Condition::Field(FieldCondition::new_match(
                "color".try_into().unwrap(),
                "red".to_string().into(),
            ))))
            .build(),
    )?;

    // Qdrant Edge doesn't support the output formats. It returns the sampled
    // point IDs and the nearest points of each sample. Convert them into the
    // offset format yourself.
    let offset_by_id: HashMap<PointId, u64> = response
        .sample_ids
        .iter()
        .enumerate()
        .map(|(offset, id)| (*id, offset as u64))
        .collect();

    let mut offsets_row: Vec<u64> = Vec::new();
    let mut offsets_col: Vec<u64> = Vec::new();
    let mut scores: Vec<f32> = Vec::new();
    for (row, nearest) in response.nearests.iter().enumerate() {
        for point in nearest {
            offsets_row.push(row as u64);
            offsets_col.push(offset_by_id[&point.id]);
            scores.push(point.score);
        }
    }
    let ids = response.sample_ids;

    Ok(())
}
