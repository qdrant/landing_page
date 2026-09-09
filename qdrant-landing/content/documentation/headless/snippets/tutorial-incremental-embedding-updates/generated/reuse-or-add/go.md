```go
// reuse an existing embedding when the same text is already stored; embed only what is new
reuseOrAdd := func(unknownIDs []Chunk) (int, int) {
	reused, added := 0, 0

	for _, c := range unknownIDs {
		sameText := &qdrant.Filter{
			Must: []*qdrant.Condition{
				qdrant.NewMatch("content_hash", c.ContentHash),
			},
		}
		hits, err := client.Scroll(context.Background(), &qdrant.ScrollPoints{
			CollectionName: COLLECTION,
			Filter:         sameText,
			Limit:          qdrant.PtrOf(uint32(1)),
			WithPayload:    qdrant.NewWithPayloadInclude("last_updated"),
			WithVectors:    qdrant.NewWithVectors(true),
		})

		var point *qdrant.PointStruct
		if len(hits) > 0 { // same text, new address: copy the vector, keep its last_updated
			point = &qdrant.PointStruct{
				Id:      qdrant.NewID(c.PointID),
				Vectors: qdrant.NewVectors(hits[0].GetVectors().GetVector().GetData()...),
				Payload: qdrant.NewValueMap(payload(c, hits[0].GetPayload()["last_updated"].GetStringValue())),
			}
			reused++
		} else { // genuinely new content: embed and insert
			point = &qdrant.PointStruct{
				Id:      qdrant.NewID(c.PointID),
				Vectors: qdrant.NewVectorsDocument(&qdrant.Document{Text: c.Text, Model: MODEL}),
				Payload: qdrant.NewValueMap(payload(c, "")),
			}
			added++
		}

		client.Upsert(context.Background(), &qdrant.UpsertPoints{
			CollectionName: COLLECTION,
			Points:         []*qdrant.PointStruct{point},
			Wait:           qdrant.PtrOf(true),
		})
	}

	return reused, added
}
```
