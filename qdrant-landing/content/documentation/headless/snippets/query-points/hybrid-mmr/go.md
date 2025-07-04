```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Prefetch: []*qdrant.PrefetchQuery{
		{
			// search vector
			Query: qdrant.NewQueryDense([]float32{0.01, 0.45, 0.67}),
			Limit: qdrant.PtrOf(uint64(100)),
		},
	},
	Query: &qdrant.Query{
		Variant: &qdrant.Query_Mmr{
			Mmr: &qdrant.MmrQuery{
				// same vector
				Vector: []float32{0.01, 0.45, 0.67},
				Lambda: 0.5,
			},
		},
	},
})
```
