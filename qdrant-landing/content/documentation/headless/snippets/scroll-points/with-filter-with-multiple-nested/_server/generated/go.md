```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Scroll(context.Background(), &qdrant.ScrollPoints{
	CollectionName: "{collection_name}",
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewMatch("diet[].food", "meat"),
			qdrant.NewMatchBool("diet[].likes", true),
		},
	},
})
```
