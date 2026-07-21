```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewMatch("city", "London"),
		},
	},
	Params: &qdrant.SearchParams{
		HnswEf: qdrant.PtrOf(uint64(128)),
	},
	Limit:           qdrant.PtrOf(uint64(3)),
	ReadConsistency: qdrant.NewReadConsistencyType(qdrant.ReadConsistencyType_Majority),
})
```
