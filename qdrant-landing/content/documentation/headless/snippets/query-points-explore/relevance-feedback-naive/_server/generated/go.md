```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQueryRelevanceFeedback(
		&qdrant.RelevanceFeedbackInput{
			Target: qdrant.NewVectorInput(0.1, 0.9, 0.23),
			Feedback: []*qdrant.FeedbackItem{
				{
					Example: qdrant.NewVectorInputID(qdrant.NewIDNum(111)),
					Score:   0.68,
				},
				{
					Example: qdrant.NewVectorInputID(qdrant.NewIDNum(222)),
					Score:   0.72,
				},
				{
					Example: qdrant.NewVectorInputID(qdrant.NewIDNum(333)),
					Score:   0.61,
				},
			},
			Strategy: qdrant.NewFeedbackStrategyNaive(&qdrant.NaiveFeedbackStrategy{
				A: 0.12, B: 0.43, C: 0.03,
			}),
		},
	),
})
```
