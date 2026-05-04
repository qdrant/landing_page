```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateVectorName(context.Background(), &qdrant.CreateVectorNameRequest{
	CollectionName: "{collection_name}",
	VectorName:     "{vector_name}",
	VectorConfig: &qdrant.CreateVectorNameRequest_DenseConfig{
		DenseConfig: &qdrant.DenseVectorCreationConfig{
			Size:     256,
			Distance: qdrant.Distance_Cosine,
		},
	},
})
```
