```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQuerySparse(
		[]uint32{1, 3, 5, 7},
		[]float32{0.1, 0.2, 0.3, 0.4}),
	Using: qdrant.PtrOf("text"),
})
```
