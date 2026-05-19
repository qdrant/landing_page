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

	if err != nil { panic(err) }
	// @hide-end

	client.DeleteVectorName(context.Background(), &qdrant.DeleteVectorNameRequest{
		CollectionName: "{collection_name}",
		VectorName:     "{vector_name}",
	})
}
