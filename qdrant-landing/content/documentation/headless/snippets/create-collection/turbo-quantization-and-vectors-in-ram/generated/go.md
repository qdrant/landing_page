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
	QuantizationConfig: qdrant.NewQuantizationTurbo(
		&qdrant.TurboQuantization{
			Memory: qdrant.Memory_Pinned.Enum(),
			Bits:   qdrant.TurboQuantBitSize_Bits1.Enum(),
		},
	),
})
```
