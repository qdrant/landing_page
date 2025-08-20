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
    Prefetch: []*qdrant.PrefetchQuery{
        {
            Query: qdrant.NewQuery(0.2, 0.8, .., ...), // <-- dense vector
            Limit: qdrant.PtrOf(uint64(50)),
        },
    },
    Query: qdrant.NewQueryFormula(&qdrant.Formula{
        Expression: qdrant.NewExpressionSum(&qdrant.SumExpression{
            Sum: []*qdrant.Expression{ //  the final score = score + exp_decay(target_time - x_time)
                qdrant.NewExpressionVariable("$score"), 
                qdrant.NewExpressionExpDecay(&qdrant.DecayParamsExpression{
                    X: qdrant.NewExpressionDatetimeKey("update_time"), // payload key
                    Target: qdrant.NewExpressionDatetime("YYYY-MM-DDT00:00:00Z"), // current datetime
                    Scale:  qdrant.PtrOf(float32(86400)), // 1 day in seconds
                    Midpoint: qdrant.PtrOf(float32(0.5)),
                }),
            },
        }),
    }),
})
```
