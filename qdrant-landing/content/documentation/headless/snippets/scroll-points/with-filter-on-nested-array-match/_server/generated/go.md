```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Scroll(context.Background(), &qdrant.ScrollPoints{
	CollectionName: "{collection_name}",
	Filter: &qdrant.Filter{
		Should: []*qdrant.Condition{
			qdrant.NewMatch("country.cities[].sightseeing", "Germany"),
		},
	},
})
```
