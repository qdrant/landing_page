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
		Memory:   qdrant.Memory_Cached.Enum(),
	}),
	HnswConfig: &qdrant.HnswConfigDiff{
		Memory: qdrant.Memory_Cold.Enum(),
	},
	QuantizationConfig: qdrant.NewQuantizationScalar(
		&qdrant.ScalarQuantization{
			Type:   qdrant.QuantizationType_Int8,
			Memory: qdrant.Memory_Pinned.Enum(),
		},
	),
	Payload: &qdrant.PayloadStorageParams{
		Memory: qdrant.Memory_Cached.Enum(),
	},
})
```
