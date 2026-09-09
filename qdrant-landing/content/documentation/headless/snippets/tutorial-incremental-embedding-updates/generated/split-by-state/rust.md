```rust
/// Compare the incoming chunk list to the collection: who is unchanged, changed, or unknown.
async fn split_by_state(
    client: &Qdrant,
    latest_chunks: &[Chunk],
) -> anyhow::Result<(HashMap<String, Chunk>, Vec<Chunk>, Vec<Chunk>, Vec<Chunk>)> {
    let incoming: HashMap<String, Chunk> = latest_chunks
        .iter()
        .map(|c| (c.point_id.clone(), c.clone()))
        .collect();

    let ids: Vec<PointId> = incoming.keys().map(|id| id.as_str().into()).collect();
    let points = client
        .get_points(
            GetPointsBuilder::new(COLLECTION, ids)
                .with_payload(PayloadIncludeSelector::new(vec!["content_hash".to_string()]))
                .with_vectors(false),
        )
        .await?;

    let mut stored: HashMap<String, String> = HashMap::new();
    for p in points.result {
        let hash = p.get("content_hash").as_str().cloned();
        if let (Some(PointIdOptions::Uuid(id)), Some(hash)) =
            (p.id.and_then(|i| i.point_id_options), hash)
        {
            stored.insert(id, hash);
        }
    }

    let (mut unchanged, mut content_changed, mut unknown_ids) =
        (Vec::new(), Vec::new(), Vec::new());
    for (pid, c) in &incoming {
        if stored.get(pid) == Some(&c.content_hash) {
            unchanged.push(c.clone());
        } else if stored.contains_key(pid) {
            content_changed.push(c.clone());
        } else {
            unknown_ids.push(c.clone());
        }
    }

    Ok((incoming, unchanged, content_changed, unknown_ids))
}

let (incoming_ids, unchanged, content_changed, unknown_ids) =
    split_by_state(&client, &latest_chunks).await?;
```
