```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQueryText(&qdrant.TextQuery{Query: "time travel"}),
			Using: qdrant.PtrOf("title"),
			Limit: qdrant.PtrOf(uint64(100)),
		},
	},
	Query: qdrant.NewQueryDense([]float32{0.01, 0.45, 0.67}),
	Using: qdrant.PtrOf("dense"),
	Limit: qdrant.PtrOf(uint64(10)),
})
```
