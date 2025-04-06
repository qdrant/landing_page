```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfigDiffMap(
		map[string]*qdrant.VectorParamsDiff{
			"my_vector": {
				HnswConfig: &qdrant.HnswConfigDiff{
					M:           qdrant.PtrOf(uint64(3)),
					EfConstruct: qdrant.PtrOf(uint64(123)),
				},
			},
		}),
	QuantizationConfig: qdrant.NewQuantizationDiffScalar(
		&qdrant.ScalarQuantization{
			Type:      qdrant.QuantizationType_Int8,
			Quantile:  qdrant.PtrOf(float32(0.8)),
			AlwaysRam: qdrant.PtrOf(true),
		}),
})
```
