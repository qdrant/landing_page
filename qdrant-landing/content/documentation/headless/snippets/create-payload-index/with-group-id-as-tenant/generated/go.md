```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
	CollectionName: "{collection_name}",
	FieldName:      "group_id",
	FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
	FieldIndexParams: qdrant.NewPayloadIndexParams(
		&qdrant.KeywordIndexParams{
			IsTenant: qdrant.PtrOf(true),
		}),
})
```
