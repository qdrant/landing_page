```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
    Host: "localhost",
    Port: 6334,
})

sample := uint64(10)
limit := uint64(2)
res, err := client.SearchMatrixPairs(ctx, &qdrant.SearchMatrixPoints{
    CollectionName: "{collection_name}",
    Sample:         &sample,
    Limit:          &limit,
    Filter: &qdrant.Filter{
        Must: []*qdrant.Condition{
            qdrant.NewMatch("color", "red"),
        },
    },
})
```
