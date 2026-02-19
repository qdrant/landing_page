package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil {
		panic(err)
	}
	// @hide-end

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Query: qdrant.NewQueryRelevanceFeedback(
			&qdrant.RelevanceFeedbackInput{
				Target: qdrant.NewVectorInput(0.01, 0.45, 0.67),
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
					A: 0.12, B: 0.43, C: 0.16,
				}),
			},
		),
	})
}
