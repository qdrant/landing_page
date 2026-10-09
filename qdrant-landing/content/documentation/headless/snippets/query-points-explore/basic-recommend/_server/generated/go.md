```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
    CollectionName: "{collection_name}",
    Query: qdrant.NewQueryRecommend(&qdrant.RecommendInput{
        Positive: []*qdrant.VectorInput{
            qdrant.NewVectorInputID(qdrant.NewIDNum(100)),
            qdrant.NewVectorInputID(qdrant.NewIDNum(231)),
        },
        Negative: []*qdrant.VectorInput{
            qdrant.NewVectorInputID(qdrant.NewIDNum(718)),
            qdrant.NewVectorInput(0.2, 0.3, 0.4, 0.5),
        },
        Strategy: qdrant.RecommendStrategy_AverageVector.Enum(),
    }),
    Filter: &qdrant.Filter{
        Must: []*qdrant.Condition{
            qdrant.NewMatch("city", "London"),
        },
    },
    Limit: qdrant.PtrOf(uint64(3)),
})
```
