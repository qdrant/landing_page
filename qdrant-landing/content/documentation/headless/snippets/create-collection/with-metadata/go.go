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
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     100,
			Distance: qdrant.Distance_Cosine,
		}),
		Metadata: qdrant.NewValueMap(map[string]any{
			"my-metadata-field": "value-1",
			"another-field":     123,
		}),
	})
}
