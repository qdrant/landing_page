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

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Prefetch:       []*qdrant.PrefetchQuery{
			// 2+ prefetches here
		},
		Query: qdrant.NewQueryRRF(
			&qdrant.Rrf{
				K: qdrant.PtrOf(uint32(60)),
			}),
	})
}
