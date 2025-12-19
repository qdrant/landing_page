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
	FieldName:      "name_of_the_field_to_index",
	FieldType:      qdrant.FieldType_FieldTypeText.Enum(),
	FieldIndexParams: qdrant.NewPayloadIndexParamsText(
		&qdrant.TextIndexParams{
			Tokenizer:   qdrant.TokenizerType_Whitespace,
			MinTokenLen: qdrant.PtrOf(uint64(2)),
			MaxTokenLen: qdrant.PtrOf(uint64(10)),
			Lowercase:   qdrant.PtrOf(true),
		}),
})
```
