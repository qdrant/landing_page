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
    Query: qdrant.NewQueryRecommend(&qdrant.RecommendInput{
        Positive: []*qdrant.VectorInput{
            qdrant.NewVectorInputID(qdrant.NewIDNum(100)),
            qdrant.NewVectorInputID(qdrant.NewIDNum(231)),
        },
        Negative: []*qdrant.VectorInput{
            qdrant.NewVectorInputID(qdrant.NewIDNum(718)),
        },
    }),
    Using: qdrant.PtrOf("image"),
    LookupFrom: &qdrant.LookupLocation{
        CollectionName: "{external_collection_name}",
        VectorName:     qdrant.PtrOf("{external_vector_name}"),
    },
})
```
