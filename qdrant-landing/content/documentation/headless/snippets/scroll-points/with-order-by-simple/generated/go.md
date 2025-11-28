```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Scroll(context.Background(), &qdrant.ScrollPoints{
	CollectionName: "{collection_name}",
	Limit:          qdrant.PtrOf(uint32(15)),
	OrderBy: &qdrant.OrderBy{
		Key: "timestamp",
	},
})
```
