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

	client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
		CollectionName:     "{collection_name}",
		QuantizationConfig: qdrant.NewQuantizationDiffDisabled(),
	})
}
