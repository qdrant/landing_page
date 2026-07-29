package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{Host: "localhost", Port: 6334})
	if err != nil { panic(err) }
	// @hide-end

	ctx := qdrant.WithHeader(context.Background(), "X-Qdrant-Route-Affinity", "user-42")
	client.Query(ctx, &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
		Limit:          qdrant.PtrOf(uint64(3)),
	})
}
