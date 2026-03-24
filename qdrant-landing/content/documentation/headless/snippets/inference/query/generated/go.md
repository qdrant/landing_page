```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model: "qdrant/bm25",
			Text:  "How to bake cookies?",
		}),
	),
	Using: qdrant.PtrOf("my-bm25-vector"),
})
```
