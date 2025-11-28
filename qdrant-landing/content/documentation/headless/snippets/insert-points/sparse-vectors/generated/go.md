```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				"text": qdrant.NewVectorSparse(
					[]uint32{6, 7},
					[]float32{1.0, 2.0}),
			}),
		},
		{
			Id: qdrant.NewIDNum(2),
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				"text": qdrant.NewVectorSparse(
					[]uint32{1, 2, 3, 4, 5},
					[]float32{0.1, 0.2, 0.3, 0.4, 0.5}),
			}),
		},
	},
})
```
