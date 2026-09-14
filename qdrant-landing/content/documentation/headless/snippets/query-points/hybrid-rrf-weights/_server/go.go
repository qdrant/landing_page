package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	// @hide-start
	if err != nil {
		panic(err)
	}
	// @hide-end

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Prefetch:       []*qdrant.PrefetchQuery{
			// Prefetches here
		},
		Query: qdrant.NewQueryRRF(
			&qdrant.Rrf{
				Weights: []float32{3.0, 1.0},
			}),
	})
}
