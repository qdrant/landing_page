package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{Host: "localhost", Port: 6334})
	if err != nil { panic(err) } // @hide

	ctx := qdrant.WithHeader(context.Background(), "x-request-id", "my-trace-id")
	client.ListCollections(ctx)
}
