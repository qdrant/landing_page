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
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     128,
			Distance: qdrant.Distance_Cosine,
			MultivectorConfig: &qdrant.MultiVectorConfig{
				Comparator: qdrant.MultiVectorComparator_MaxSim,
			},
		}),
	})
}
