```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Scroll(context.Background(), &qdrant.ScrollPoints{
	CollectionName: "{collection_name}",
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewNestedFilter("diet", &qdrant.Filter{
				Must: []*qdrant.Condition{
					qdrant.NewMatch("food", "meat"),
					qdrant.NewMatchBool("likes", true),
				},
			}),
		},
	},
})
```
