package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "{collection_name}",
		Points: []*qdrant.PointStruct{
			{
				Id:      qdrant.NewIDNum(111),
				Vectors: qdrant.NewVectors(0.1, 0.2, 0.3),
			},
		},
		ShardKeySelector: &qdrant.ShardKeySelector{
			ShardKeys: []*qdrant.ShardKey{
				qdrant.NewShardKey("user_1"),
			},
		},
	})
}
