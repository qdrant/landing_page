```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "venues",
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  "quiet café to work from",
		Model: "sentence-transformers/all-minilm-l6-v2",
	}),
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewGeoRadius("location", 52.520711, 13.403683, 1500.0),
		},
	},
	Limit: qdrant.PtrOf(uint64(5)),
})
```
