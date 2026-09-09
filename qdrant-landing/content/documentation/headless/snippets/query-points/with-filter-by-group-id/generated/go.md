```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.1, 0.1, 0.9),
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewMatch("group_id", "user_1"),
		},
	},
})
```
