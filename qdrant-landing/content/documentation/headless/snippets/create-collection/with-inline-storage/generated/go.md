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
		Memory:   qdrant.Memory_Cold.Enum(),
	}),
	QuantizationConfig: qdrant.NewQuantizationBinary(
		&qdrant.BinaryQuantization{
			Memory: qdrant.Memory_Cold.Enum(),
		},
	),
	HnswConfig: &qdrant.HnswConfigDiff{
		Memory:        qdrant.Memory_Cold.Enum(),
		InlineStorage: qdrant.PtrOf(true),
	},
})
```
