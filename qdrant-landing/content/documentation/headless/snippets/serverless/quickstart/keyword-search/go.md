```go
import (
	"context"
	"fmt"

	"github.com/qdrant/go-client/qdrant"
)

results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "menu",
	Query:          qdrant.NewQueryText(&qdrant.TextQuery{Query: "tahini"}),
	Using:          qdrant.PtrOf("description"),
	Limit:          qdrant.PtrOf(uint64(3)),
	WithPayload:    qdrant.NewWithPayload(true),
})
if err != nil {
	panic(err)
}

for _, hit := range results {
	fmt.Println(hit.Payload["name"].GetStringValue(), hit.Score)
}
```
