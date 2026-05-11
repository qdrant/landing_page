```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateVectorName(context.Background(), &qdrant.CreateVectorNameRequest{
	CollectionName: "{collection_name}",
	VectorName:     "{vector_name}",
	VectorConfig: &qdrant.CreateVectorNameRequest_SparseConfig{
		SparseConfig: &qdrant.SparseVectorCreationConfig{
			Modifier: qdrant.Modifier_Idf.Enum(),
		},
	},
})
```
