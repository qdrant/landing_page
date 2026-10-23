```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQueryID(qdrant.NewID("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")),
})
```
