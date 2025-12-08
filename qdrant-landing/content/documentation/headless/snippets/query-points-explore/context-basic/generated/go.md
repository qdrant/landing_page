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
    Query: qdrant.NewQueryContext(&qdrant.ContextInput{
        Pairs: []*qdrant.ContextInputPair{
            {
                Positive: qdrant.NewVectorInputID(qdrant.NewIDNum(100)),
                Negative: qdrant.NewVectorInputID(qdrant.NewIDNum(718)),
            },
            {
                Positive: qdrant.NewVectorInputID(qdrant.NewIDNum(200)),
                Negative: qdrant.NewVectorInputID(qdrant.NewIDNum(300)),
            },
        },
    }),
})
```
