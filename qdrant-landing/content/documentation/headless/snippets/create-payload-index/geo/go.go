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

	// @hide-start
	if err != nil {
		panic(err)
	}
	// @hide-end

	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: "{collection_name}",
		FieldName:      "location",
		FieldType:      qdrant.FieldType_FieldTypeGeo.Enum(),
	})
}
