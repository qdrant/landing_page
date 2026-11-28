```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
	CollectionName: "venues",
	FieldName:      "location",
	FieldType:      qdrant.FieldType_FieldTypeGeo.Enum(),
})
```
