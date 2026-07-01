package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})
	// @hide-end

	if err != nil { panic(err) } // @hide

	client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
		CollectionName: "{collection_name}",
		HnswConfig: &qdrant.HnswConfigDiff{
			MaxIndexingThreads: qdrant.PtrOf(uint64(4)),
		},
	})
}
