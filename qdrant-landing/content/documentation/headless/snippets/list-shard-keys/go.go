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

	// @hide-start
	if err != nil {
		panic(err)
	}
	// @hide-end

	keys, err := client.ListShardKeys(context.Background(), "{collection_name}")
}
