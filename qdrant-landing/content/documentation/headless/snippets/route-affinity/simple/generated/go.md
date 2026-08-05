```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

ctx := qdrant.WithHeader(context.Background(), "X-Qdrant-Route-Affinity", "user-42")
client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
	Limit:          qdrant.PtrOf(uint64(3)),
})
```
