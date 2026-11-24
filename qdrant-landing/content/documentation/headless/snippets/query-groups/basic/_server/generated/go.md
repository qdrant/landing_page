```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.QueryGroups(context.Background(), &qdrant.QueryPointGroups{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
	GroupBy:        "document_id",
	GroupSize:      qdrant.PtrOf(uint64(2)),
})
```
