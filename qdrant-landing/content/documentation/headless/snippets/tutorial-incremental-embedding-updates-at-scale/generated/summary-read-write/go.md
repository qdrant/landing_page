```go
// Store bucket digests in the summary collection, one point per group.
// digests: the full list of N_BUCKETS digests.
// groups:  which group points to rewrite; nil rewrites all of them.
writeMeta := func(digests []uint64, groups []int) {
	if groups == nil {
		for g := 0; g < N_META; g++ {
			groups = append(groups, g)
		}
	}

	points := make([]*qdrant.PointStruct, 0, len(groups))
	for _, g := range groups {
		// group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
		start := g * GROUP_SIZE
		groupDigests := make([]any, 0, GROUP_SIZE)
		for _, digest := range digests[start : start+GROUP_SIZE] {
			groupDigests = append(groupDigests, digest)
		}
		points = append(points, &qdrant.PointStruct{
			Id:      qdrant.NewIDNum(uint64(g)),
			Vectors: qdrant.NewVectors(1.0), // dummy: this collection is never searched
			Payload: qdrant.NewValueMap(map[string]any{"group": g, "digests": groupDigests}),
		})
	}
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: META,
		Points:         points,
		Wait:           qdrant.PtrOf(true),
	})
}

// Read the summary back as a flat list of N_BUCKETS digests.
readMeta := func() []uint64 {
	digests := make([]uint64, N_BUCKETS)
	ids := make([]*qdrant.PointId, 0, N_META)
	for g := 0; g < N_META; g++ {
		ids = append(ids, qdrant.NewIDNum(uint64(g)))
	}

	points, err := client.Get(context.Background(), &qdrant.GetPoints{
		CollectionName: META,
		Ids:            ids,
		WithPayload:    qdrant.NewWithPayload(true),
	})

	for _, point := range points {
		g := int(point.GetPayload()["group"].GetIntegerValue())
		for slot, digest := range point.GetPayload()["digests"].GetListValue().GetValues() {
			digests[g*GROUP_SIZE+slot] = uint64(digest.GetIntegerValue())
		}
	}
	return digests
}

writeMeta(computeDigests(prepare(CHUNKS)), nil)
readMeta()
```
