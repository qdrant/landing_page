```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     1536,
		Distance: qdrant.Distance_Cosine,
	}),
	QuantizationConfig: qdrant.NewQuantizationTurbo(
		&qdrant.TurboQuantization{
			AlwaysRam: qdrant.PtrOf(true),
			Bits:      qdrant.TurboQuantBitSize_Bits2.Enum(),
		},
	),
})
```
