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

	client.CreateShardKey(context.Background(), "{collection_name}", &qdrant.CreateShardKey{
		ShardKey: qdrant.NewShardKey("{shard_key}"),
	})
}
