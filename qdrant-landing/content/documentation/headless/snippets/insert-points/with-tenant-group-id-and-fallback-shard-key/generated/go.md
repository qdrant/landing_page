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
		}
	},
	ShardKeySelector: &qdrant.ShardKeySelector{
		ShardKeys: []*qdrant.ShardKey{
			qdrant.NewShardKey("user_1"),
		},
		Fallback: qdrant.NewShardKey("default"),
	},
})
```
