```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
    Host: "localhost",
    Port: 6334,
})

filter := qdrant.Filter{
    Must: []*qdrant.Condition{
        qdrant.NewMatch("city", "London"),
    },
}
client.QueryBatch(context.Background(), &qdrant.QueryBatchPoints{
    CollectionName: "{collection_name}",
    QueryPoints: []*qdrant.QueryPoints{
        {
            CollectionName: "{collection_name}",
            Query: qdrant.NewQueryRecommend(&qdrant.RecommendInput{
                Positive: []*qdrant.VectorInput{
                    qdrant.NewVectorInputID(qdrant.NewIDNum(100)),
                    qdrant.NewVectorInputID(qdrant.NewIDNum(231)),
                },
                Negative: []*qdrant.VectorInput{
                    qdrant.NewVectorInputID(qdrant.NewIDNum(718)),
                },
            },
            ),
            Filter: &filter,
        },
        {
            CollectionName: "{collection_name}",
            Query: qdrant.NewQueryRecommend(&qdrant.RecommendInput{
                Positive: []*qdrant.VectorInput{
                    qdrant.NewVectorInputID(qdrant.NewIDNum(200)),
                    qdrant.NewVectorInputID(qdrant.NewIDNum(67)),
                },
                Negative: []*qdrant.VectorInput{
                    qdrant.NewVectorInputID(qdrant.NewIDNum(300)),
                },
            },
            ),
            Filter: &filter,
        },
    },
},
)
```
