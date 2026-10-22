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

	if err != nil { panic(err) }
	// @hide-end

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Prefetch: []*qdrant.PrefetchQuery{
			{
				Query: qdrant.NewQueryDense([]float32{0.01, 0.45, 0.67}),
				Using: qdrant.PtrOf("dense"),
				Limit: qdrant.PtrOf(uint64(100)),
			},
		},
		Query: &qdrant.Query{
			Variant: &qdrant.Query_Text{
				Text: &qdrant.TextQuery{Query: "time travel"},
			},
		},
		Using: qdrant.PtrOf("title"),
		Limit: qdrant.PtrOf(uint64(10)),
	})
}
