```go
import (
	"context"
	"fmt"

	"github.com/qdrant/go-client/qdrant"
)

results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "menu",
	Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: "vegetarian dishes", Model: model}),
	Using:          qdrant.PtrOf("dense"),
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
