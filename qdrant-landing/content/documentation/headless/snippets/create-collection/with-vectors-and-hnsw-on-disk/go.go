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

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: "{collection_name}",
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     768,
			Distance: qdrant.Distance_Cosine,
			Memory:   qdrant.Memory_Cold.Enum(),
		}),
		HnswConfig: &qdrant.HnswConfigDiff{
			Memory: qdrant.Memory_Cold.Enum(),
		},
	})
}
