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

	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: "venues",
		FieldName:      "location",
		FieldType:      qdrant.FieldType_FieldTypeGeo.Enum(),
	})
}
