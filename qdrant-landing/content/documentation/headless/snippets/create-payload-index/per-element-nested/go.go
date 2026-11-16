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

	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: "{collection_name}",
		FieldName:      "offers[].shop",
		FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
		FieldIndexParams: qdrant.NewPayloadIndexParamsKeyword(
			&qdrant.KeywordIndexParams{
				Nested: qdrant.PtrOf("offers"),
			}),
	})

	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: "{collection_name}",
		FieldName:      "offers[].price",
		FieldType:      qdrant.FieldType_FieldTypeFloat.Enum(),
		FieldIndexParams: qdrant.NewPayloadIndexParamsFloat(
			&qdrant.FloatIndexParams{
				Nested: qdrant.PtrOf("offers"),
			}),
	})
}
