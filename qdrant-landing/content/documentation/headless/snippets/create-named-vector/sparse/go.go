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

	client.CreateVectorName(context.Background(), &qdrant.CreateVectorNameRequest{
		CollectionName: "{collection_name}",
		VectorName:     "{vector_name}",
		VectorConfig: &qdrant.CreateVectorNameRequest_SparseConfig{
			SparseConfig: &qdrant.SparseVectorCreationConfig{
				Modifier: qdrant.Modifier_Idf.Enum(),
			},
		},
	})
}
