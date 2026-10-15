```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: &qdrant.Query{
		Variant: &qdrant.Query_Text{
			Text: &qdrant.TextQuery{Query: "time travel"},
		},
	},
	Using:       qdrant.PtrOf("title"),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})
```
