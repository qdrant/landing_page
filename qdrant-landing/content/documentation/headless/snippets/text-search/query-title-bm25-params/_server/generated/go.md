```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryText(qdrant.NewTextQueryBM25("time travel", &qdrant.Bm25Params{
		K: qdrant.PtrOf(float32(1.5)),
		B: qdrant.PtrOf(float32(0.5)),
	})),
	Using:       qdrant.PtrOf("title"),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})
```
