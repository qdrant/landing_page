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
			Vectors: qdrant.NewVectorsMulti(
				[][]float32{
					{-0.013, 0.020, -0.007, -0.111},
					{-0.030, -0.055, 0.001, 0.072},
					{-0.041, 0.014, -0.032, -0.062}}),
		},
	},
})
```
