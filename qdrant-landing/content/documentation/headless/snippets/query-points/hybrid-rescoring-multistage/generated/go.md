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
			Prefetch: []*qdrant.PrefetchQuery{
				{
					Query: qdrant.NewQueryDense([]float32{1, 23, 45, 67}),
					Using: qdrant.PtrOf("mrl_byte"),
					Limit: qdrant.PtrOf(uint64(1000)),
				},
			},
			Query: qdrant.NewQueryDense([]float32{0.01, 0.45, 0.67}),
			Limit: qdrant.PtrOf(uint64(100)),
			Using: qdrant.PtrOf("full"),
		},
	},
	Query: qdrant.NewQueryMulti([][]float32{
		{0.1, 0.2},
		{0.2, 0.1},
		{0.8, 0.9},
	}),
	Using: qdrant.PtrOf("colbert"),
})
```
