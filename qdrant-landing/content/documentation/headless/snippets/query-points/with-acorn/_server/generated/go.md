```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
	Params: &qdrant.SearchParams{
		Acorn: &qdrant.AcornSearchParams{
			Enable:          qdrant.PtrOf(true),
			MaxSelectivity:  qdrant.PtrOf(0.4),
		},
	},
})
```
