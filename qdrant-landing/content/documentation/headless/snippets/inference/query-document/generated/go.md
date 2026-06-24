```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Text:  "My Query Text",
			Model: "<the-model-to-use>",
		}),
	),
})
```
