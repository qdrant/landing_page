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

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: "{collection_name}",
		// ... other collection parameters
		ShardNumber:    qdrant.PtrOf(uint32(1)),
		ShardingMethod: qdrant.ShardingMethod_Custom.Enum(),
	})
}
