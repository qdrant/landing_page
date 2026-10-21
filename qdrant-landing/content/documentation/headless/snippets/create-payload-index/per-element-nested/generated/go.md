```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

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
```
