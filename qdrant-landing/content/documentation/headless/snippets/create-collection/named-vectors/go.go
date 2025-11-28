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

	if err != nil { panic(err) } // @hide

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: "{collection_name}",
		VectorsConfig: qdrant.NewVectorsConfigMap(
			map[string]*qdrant.VectorParams{
				"image": {
					Size:     4,
					Distance: qdrant.Distance_Dot,
				},
				"text": {
					Size:     5,
					Distance: qdrant.Distance_Cosine,
				},
			}),
		SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
			map[string]*qdrant.SparseVectorParams{
				"text-sparse": {},
			},
		),
	})
}
