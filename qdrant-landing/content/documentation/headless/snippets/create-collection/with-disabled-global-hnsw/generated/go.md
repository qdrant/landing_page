```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     768,
		Distance: qdrant.Distance_Cosine,
	}),
	HnswConfig: &qdrant.HnswConfigDiff{
		PayloadM: qdrant.PtrOf(uint64(16)),
		M:        qdrant.PtrOf(uint64(0)),
	},
})
```
