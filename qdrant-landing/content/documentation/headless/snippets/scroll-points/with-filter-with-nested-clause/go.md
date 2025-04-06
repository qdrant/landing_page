```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

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
