```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "tenant-" + tenantID,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  "quarterly report",
		Model: "sentence-transformers/all-minilm-l6-v2",
	}),
	Limit: qdrant.PtrOf(uint64(10)),
})
if err != nil {
	panic(err)
}
```
