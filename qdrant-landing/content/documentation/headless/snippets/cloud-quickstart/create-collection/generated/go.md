```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "items",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     384,
		Distance: qdrant.Distance_Cosine,
	}),
})
```
