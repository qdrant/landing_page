package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil {
		panic(err)
	}
	// @hide-end

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "books",
		Prefetch: []*qdrant.PrefetchQuery{
			{
				Using: qdrant.PtrOf("description-dense"),
				Query: qdrant.NewQueryDocument(&qdrant.Document{
					Text:  "time travel",
					Model: "sentence-transformers/all-minilm-l6-v2",
				}),
				ScoreThreshold: qdrant.PtrOf(float32(0.5)),
			},
			{
				Using: qdrant.PtrOf("title"),
				Query: qdrant.NewQueryText(&qdrant.TextQuery{Query: "time travel"}),
			},
		},
		Query:       qdrant.NewQueryFusion(qdrant.Fusion_RRF),
		WithPayload: qdrant.NewWithPayload(true),
		Limit:       qdrant.PtrOf(uint64(10)),
	})
}
