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
            Query: qdrant.NewQuery(0.01, 0.45, 0.67),
        },
    },
    Query: qdrant.NewQueryFormula(&qdrant.Formula{
        Expression: qdrant.NewExpressionSum(&qdrant.SumExpression{
            Sum: []*qdrant.Expression{
                qdrant.NewExpressionVariable("$score"),
                qdrant.NewExpressionMult(&qdrant.MultExpression{
                    Mult: []*qdrant.Expression{
                        qdrant.NewExpressionConstant(0.5),
                        qdrant.NewExpressionCondition(qdrant.NewMatchKeywords("tag", "h1", "h2", "h3", "h4")),
                    },
                }),
                qdrant.NewExpressionMult(&qdrant.MultExpression{
                    Mult: []*qdrant.Expression{
                        qdrant.NewExpressionConstant(0.25),
                        qdrant.NewExpressionCondition(qdrant.NewMatchKeywords("tag", "p", "li")),
                    },
                }),
            },
        }),
    }),
})
```
