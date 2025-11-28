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
			Query: qdrant.NewQueryDense([]float32{1, 23, 45, 67}),
			Using: qdrant.PtrOf("mrl_byte"),
			Limit: qdrant.PtrOf(uint64(1000)),
		},
	},
	Query: qdrant.NewQueryDense([]float32{0.01, 0.299, 0.45, 0.67}),
	Using: qdrant.PtrOf("full"),
})
```
