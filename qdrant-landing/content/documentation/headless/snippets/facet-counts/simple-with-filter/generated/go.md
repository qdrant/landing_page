```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
    Host: "localhost",
    Port: 6334,
})

res, err := client.Facet(context.Background(), &qdrant.FacetCounts{
    CollectionName: "{collection_name}",
    Key:            "size",
        Filter: &qdrant.Filter{
        Must: []*qdrant.Condition{
            qdrant.NewMatch("color", "red"),
        },
    },
})
```
