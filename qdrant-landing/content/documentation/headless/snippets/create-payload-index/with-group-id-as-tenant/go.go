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

	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: "{collection_name}",
		FieldName:      "group_id",
		FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
		FieldIndexParams: qdrant.NewPayloadIndexParams(
			&qdrant.KeywordIndexParams{
				IsTenant: qdrant.PtrOf(true),
			}),
	})
}
