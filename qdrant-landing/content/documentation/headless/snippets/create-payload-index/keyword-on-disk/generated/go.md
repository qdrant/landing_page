```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
	CollectionName: "{collection_name}",
	FieldName:      "name_of_the_field_to_index",
	FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
	FieldIndexParams: qdrant.NewPayloadIndexParamsKeyword(
		&qdrant.KeywordIndexParams{
			Memory: qdrant.Memory_Cold.Enum(),
		}),
})
```
