```go
import (
	"context"
	"fmt"

	"github.com/qdrant/go-client/qdrant"
)

queryText := "vegetarian dishes"

results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "items",
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  queryText,
		Model: "sentence-transformers/all-MiniLM-L6-v2",
	}),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(5)),
})
if err != nil {
	panic(err)
}

for _, result := range results {
	fmt.Printf("Item: %s\n", result.Payload["item_name"].GetStringValue())
	fmt.Printf("Score: %f\n", result.Score)
	fmt.Printf("Description: %s\n", result.Payload["description"].GetStringValue())
	fmt.Printf("Price: %s\n", result.Payload["price"].GetStringValue())
	fmt.Println("---")
}
```
