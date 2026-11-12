```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryText(&qdrant.TextQuery{Query: "time travel"}),
	Using:       qdrant.PtrOf("title"),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})
```
