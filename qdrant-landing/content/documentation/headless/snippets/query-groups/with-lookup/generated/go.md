```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.QueryGroups(context.Background(), &qdrant.QueryPointGroups{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
	GroupBy:        "document_id",
	GroupSize:      qdrant.PtrOf(uint64(2)),
	WithLookup: &qdrant.WithLookup{
		Collection:  "documents",
		WithPayload: qdrant.NewWithPayloadInclude("title", "text"),
	},
})
```
