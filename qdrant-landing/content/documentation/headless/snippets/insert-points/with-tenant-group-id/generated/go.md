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
			Id:      qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectors(0.9, 0.1, 0.1),
			Payload: qdrant.NewValueMap(map[string]any{"group_id": "user_1"}),
		},
		{
			Id:      qdrant.NewIDNum(2),
			Vectors: qdrant.NewVectors(0.1, 0.9, 0.1),
			Payload: qdrant.NewValueMap(map[string]any{"group_id": "user_1"}),
		},
		{
			Id:      qdrant.NewIDNum(3),
			Vectors: qdrant.NewVectors(0.1, 0.1, 0.9),
			Payload: qdrant.NewValueMap(map[string]any{"group_id": "user_2"}),
		},
	},
})
```
