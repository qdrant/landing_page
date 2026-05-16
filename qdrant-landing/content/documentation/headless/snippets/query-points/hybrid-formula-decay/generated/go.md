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
			Prefetch: []*qdrant.PrefetchQuery{
				{
					Query: qdrant.NewQuerySparse([]uint32{1, 42}, []float32{0.22, 0.8}),
					Using: qdrant.PtrOf("sparse"),
					Limit: qdrant.PtrOf(uint64(100)),
				},
				{
					Query: qdrant.NewQueryDense([]float32{0.01, 0.45, 0.67}),
					Using: qdrant.PtrOf("dense"),
					Limit: qdrant.PtrOf(uint64(100)),
				},
			},
			Query: qdrant.NewQueryRRF(&qdrant.Rrf{}),
			Limit: qdrant.PtrOf(uint64(100)),
		},
	},
	Query: qdrant.NewQueryFormula(&qdrant.Formula{
		Expression: qdrant.NewExpressionSum(&qdrant.SumExpression{
			Sum: []*qdrant.Expression{
				qdrant.NewExpressionVariable("$score"), // the fused score from the RRF prefetch
				qdrant.NewExpressionExpDecay(&qdrant.DecayParamsExpression{
					X:        qdrant.NewExpressionDatetimeKey("published_at"),
					Target:   qdrant.NewExpressionDatetime("YYYY-MM-DDT00:00:00Z"),
					Scale:    qdrant.PtrOf(float32(86400 * 180)), // 180 days in seconds
					Midpoint: qdrant.PtrOf(float32(0.5)),
				}),
			},
		}),
	}),
	Limit: qdrant.PtrOf(uint64(10)),
})
```
