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
					qdrant.NewMatch("color", "red"),
				},
			},
		},
		{
			Query: qdrant.NewQuery(0.01, 0.45, 0.67),
			Filter: &qdrant.Filter{
				Must: []*qdrant.Condition{
					qdrant.NewMatch("color", "green"),
				},
			},
		},
	},
	Query: qdrant.NewQueryOrderBy(&qdrant.OrderBy{
		Key: "price",
	}),
})
```
