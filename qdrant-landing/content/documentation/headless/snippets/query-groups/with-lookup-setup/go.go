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
		CollectionName: "chunks",
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     4,
			Distance: qdrant.Distance_Cosine,
		}),
	})

	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: "chunks",
		FieldName:      "document_id",
		FieldType:      qdrant.FieldType_FieldTypeInteger.Enum(),
	})

	// No vectors, payload only.
	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: "documents",
		VectorsConfig: qdrant.NewVectorsConfigMap(
			map[string]*qdrant.VectorParams{},
		),
	})
}
