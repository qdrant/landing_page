package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "xyz-example.qdrant.io",
		Port:   6334,
		APIKey: "<your-api-key>",
		UseTLS: true,
	})
	if err != nil {
		panic(err)
	}
	defer client.Close()
	// @hide-end

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: "items",
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     384,
			Distance: qdrant.Distance_Cosine,
		}),
	})
}
