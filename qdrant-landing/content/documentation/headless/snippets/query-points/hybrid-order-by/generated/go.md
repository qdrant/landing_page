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
			Query: qdrant.NewQuery(0.01, 0.45, 0.67),
			Filter: &qdrant.Filter{
				Must: []*qdrant.Condition{
					qdrant.NewRange("price", &qdrant.Range{
						Gte: qdrant.PtrOf(10.0),
						Lte: qdrant.PtrOf(80.0),
					}),
				},
			},
			Limit: qdrant.PtrOf(uint64(100)),
		},
	},
	Query: qdrant.NewQueryOrderBy(&qdrant.OrderBy{
		Key:       "price",
		Direction: qdrant.Direction_Asc.Enum(),
	}),
	Limit:       qdrant.PtrOf(uint64(10)),
	WithPayload: qdrant.NewWithPayload(true),
})
```
