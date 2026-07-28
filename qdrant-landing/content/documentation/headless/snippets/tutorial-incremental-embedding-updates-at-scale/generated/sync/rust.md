```rust
async fn sync(
    client: &Qdrant,
    latest_chunks: &[Chunk],
) -> anyhow::Result<(Vec<usize>, usize, usize, usize)> {
    let latest = prepare(latest_chunks);

    // group the source chunks by bucket once
    let mut source_by_bucket: HashMap<usize, HashMap<String, Chunk>> = HashMap::new();
    for c in &latest {
        let b = bucket(&c.point_id);
        source_by_bucket
            .entry(b)
            .or_default()
            .insert(c.point_id.clone(), c.clone());
    }

    // steps 1-3: which buckets changed
    let source = compute_digests(&latest);
    let stored = read_meta(client).await?;
    let mut changed = Vec::new();
    for b in 0..N_BUCKETS {
        if source[b] != stored[b] {
            changed.push(b);
        }
    }

    // step 4: reconcile each changed bucket
    let (mut added, mut re_embedded, mut deleted) = (0, 0, 0);
    let empty = HashMap::new();
    for &b in &changed {
        let counts =
            reconcile_bucket(client, b, source_by_bucket.get(&b).unwrap_or(&empty)).await?;
        added += counts.0;
        re_embedded += counts.1;
        deleted += counts.2;
    }

    // step 5: rewrite only the changed groups of the summary, after the data writes
    let mut changed_groups: Vec<usize> = changed.iter().map(|b| b / GROUP_SIZE).collect();
    changed_groups.dedup(); // changed is ascending, so equal group numbers are adjacent
    write_meta(client, &source, Some(&changed_groups)).await?;

    Ok((changed, added, re_embedded, deleted))
}
```
