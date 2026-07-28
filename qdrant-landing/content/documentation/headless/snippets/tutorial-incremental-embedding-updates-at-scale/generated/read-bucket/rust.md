```rust
/// Return a map of point ID to content hash for every chunk stored in bucket b.
///
/// Pages through the results so nothing is missed in a large bucket.
async fn read_bucket(client: &Qdrant, b: usize) -> anyhow::Result<HashMap<String, String>> {
    let mut stored = HashMap::new();
    let mut offset: Option<PointId> = None;
    loop {
        let mut request = ScrollPointsBuilder::new(MAIN)
            .filter(Filter::must([Condition::matches(
                "sync_bucket",
                b as i64,
            )]))
            .with_payload(PayloadIncludeSelector::new(vec![
                "content_hash".to_string()
            ]))
            .with_vectors(false)
            .limit(1000);
        if let Some(offset) = offset {
            request = request.offset(offset);
        }

        let response = client.scroll(request).await?;
        for point in response.result {
            let hash = point.get("content_hash").as_str().cloned();
            if let (Some(PointIdOptions::Uuid(id)), Some(hash)) =
                (point.id.and_then(|i| i.point_id_options), hash)
            {
                stored.insert(id, hash);
            }
        }

        offset = response.next_page_offset;
        if offset.is_none() {
            return Ok(stored);
        }
    }
}
```
