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
		MustNot: []*qdrant.Condition{
			qdrant.NewFilterAsCondition(&qdrant.Filter{
				Must: []*qdrant.Condition{
					qdrant.NewMatch("city", "London"),
					qdrant.NewMatch("color", "red"),
				},
			}),
		},
	},
})
```
