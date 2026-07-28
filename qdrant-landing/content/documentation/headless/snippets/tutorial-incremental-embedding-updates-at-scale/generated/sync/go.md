```go
sync := func(latestChunks []Chunk) map[string]any {
	latest := prepare(latestChunks)

	// group the source chunks by bucket once
	sourceByBucket := make(map[int]map[string]Chunk)
	for _, c := range latest {
		b := bucket(c.PointID)
		if sourceByBucket[b] == nil {
			sourceByBucket[b] = make(map[string]Chunk)
		}
		sourceByBucket[b][c.PointID] = c
	}

	// steps 1-3: which buckets changed
	source := computeDigests(latest)
	stored := readMeta()
	changed := make([]int, 0) // non-nil: an empty list must not mean "rewrite every group"
	for b := 0; b < N_BUCKETS; b++ {
		if source[b] != stored[b] {
			changed = append(changed, b)
		}
	}

	// step 4: reconcile each changed bucket
	added, reEmbedded, deleted := 0, 0, 0
	for _, b := range changed {
		a, r, d := reconcileBucket(b, sourceByBucket[b])
		added += a
		reEmbedded += r
		deleted += d
	}

	// step 5: rewrite only the changed groups of the summary, after the data writes
	changedGroups := make([]int, 0)
	seen := make(map[int]bool)
	for _, b := range changed {
		g := b / GROUP_SIZE
		if !seen[g] {
			seen[g] = true
			changedGroups = append(changedGroups, g)
		}
	}
	writeMeta(source, changedGroups)

	return map[string]any{
		"changed_buckets": changed,
		"added":           added,
		"re_embedded":     reEmbedded,
		"deleted":         deleted,
	}
}
```
