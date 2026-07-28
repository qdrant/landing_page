```rust
/// Store bucket digests in the summary collection, one point per group.
///
/// digests: the full list of N_BUCKETS digests.
/// groups:  which group points to rewrite; None rewrites all of them.
async fn write_meta(
    client: &Qdrant,
    digests: &[u64],
    groups: Option<&[usize]>,
) -> anyhow::Result<()> {
    let all: Vec<usize> = (0..N_META).collect();
    let groups = groups.unwrap_or(&all);

    let mut points = Vec::new();
    for &g in groups {
        // group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
        let start = g * GROUP_SIZE;
        let group_digests = &digests[start..start + GROUP_SIZE];
        points.push(PointStruct::new(
            g as u64,
            vec![1.0f32], // dummy: this collection is never searched
            Payload::try_from(json!({"group": g, "digests": group_digests}))?,
        ));
    }
    client
        .upsert_points(UpsertPointsBuilder::new(META, points).wait(true))
        .await?;
    Ok(())
}

/// Read the summary back as a flat list of N_BUCKETS digests.
async fn read_meta(client: &Qdrant) -> anyhow::Result<Vec<u64>> {
    let mut digests = vec![0u64; N_BUCKETS];
    let ids: Vec<PointId> = (0..N_META as u64).map(PointId::from).collect();

    let points = client
        .get_points(GetPointsBuilder::new(META, ids).with_payload(true))
        .await?;

    for point in points.result {
        let g = point.get("group").as_integer().unwrap_or(0) as usize;
        for (slot, digest) in point
            .get("digests")
            .as_list()
            .unwrap_or_default()
            .iter()
            .enumerate()
        {
            digests[g * GROUP_SIZE + slot] = digest.as_integer().unwrap_or(0) as u64;
        }
    }
    Ok(digests)
}

write_meta(&client, &compute_digests(&prepare(&chunks)), None).await?;
read_meta(&client).await?;
```
