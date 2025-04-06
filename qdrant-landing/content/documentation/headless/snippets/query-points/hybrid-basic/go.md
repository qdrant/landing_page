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
			Query: qdrant.NewQuerySparse([]uint32{1, 42}, []float32{0.22, 0.8}),
			Using: qdrant.PtrOf("sparse"),
		},
		{
			Query: qdrant.NewQueryDense([]float32{0.01, 0.45, 0.67}),
			Using: qdrant.PtrOf("dense"),
		},
	},
	Query: qdrant.NewQueryFusion(qdrant.Fusion_RRF),
})
```
