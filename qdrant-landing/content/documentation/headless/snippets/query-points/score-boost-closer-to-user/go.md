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
            Query: qdrant.NewQuery(0.2, 0.8),
        },
    },
    Query: qdrant.NewQueryFormula(&qdrant.Formula{
        Expression: qdrant.NewExpressionSum(&qdrant.SumExpression{
            Sum: []*qdrant.Expression{
                qdrant.NewExpressionVariable("$score"),
                qdrant.NewExpressionExpDecay(&qdrant.DecayParamsExpression{
                    X: qdrant.NewExpressionGeoDistance(&qdrant.GeoDistance{
                        Origin: &qdrant.GeoPoint{
                            Lat: 52.504043,
                            Lon: 13.393236,
                        },
                        To: "geo.location",
                    }),
                }),
            },
        }),
        Defaults: qdrant.NewValueMap(map[string]any{
            "geo.location": map[string]any{
                "lat": 48.137154,
                "lon": 11.576124,
            },
        }),
    }),
})
```
