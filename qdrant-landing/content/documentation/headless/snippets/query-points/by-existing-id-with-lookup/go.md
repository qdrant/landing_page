```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQueryID(qdrant.NewID("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")),
	Using:          qdrant.PtrOf("512d-vector"),
	LookupFrom: &qdrant.LookupLocation{
		CollectionName: "another_collection",
		VectorName:     qdrant.PtrOf("image-512"),
	},
})
```
