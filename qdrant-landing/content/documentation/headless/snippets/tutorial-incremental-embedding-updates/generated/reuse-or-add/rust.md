```rust
/// Reuse an existing embedding when the same text is already stored; embed only what is new.
async fn reuse_or_add(client: &Qdrant, unknown_ids: &[Chunk]) -> anyhow::Result<(usize, usize)> {
    let (mut reused, mut added) = (0, 0);

    for c in unknown_ids {
        let same_text =
            Filter::must([Condition::matches("content_hash", c.content_hash.clone())]);
        let hits = client
            .scroll(
                ScrollPointsBuilder::new(COLLECTION)
                    .filter(same_text)
                    .limit(1)
                    .with_payload(PayloadIncludeSelector::new(vec![
                        "last_updated".to_string()
                    ]))
                    .with_vectors(true),
            )
            .await?
            .result;

        let point = if let Some(hit) = hits.into_iter().next() {
            // same text, new address: copy the vector, keep its last_updated
            let last_updated = hit.get("last_updated").as_str().cloned();
            let vector: Vec<f32> = match hit.vectors.and_then(|v| v.vectors_options) {
                Some(vectors_output::VectorsOptions::Vector(v)) => match v.vector {
                    Some(vector_output::Vector::Dense(dense)) => dense.data,
                    _ => anyhow::bail!("expected a dense vector on the stored point"),
                },
                _ => anyhow::bail!("expected a dense vector on the stored point"),
            };
            reused += 1;
            PointStruct::new(c.point_id.clone(), vector, payload(c, last_updated)?)
        } else {
            // genuinely new content: embed and insert
            added += 1;
            PointStruct::new(
                c.point_id.clone(),
                Document::new(&c.text, MODEL),
                payload(c, None)?,
            )
        };

        client
            .upsert_points(UpsertPointsBuilder::new(COLLECTION, vec![point]).wait(true))
            .await?;
    }

    Ok((reused, added))
}
```
