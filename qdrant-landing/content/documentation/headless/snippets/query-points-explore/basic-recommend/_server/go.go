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

	if err != nil { panic(err) }
	// @hide-end

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
}
